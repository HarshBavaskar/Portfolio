import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, initScroll, scrollTo, reduced } from '../../lib/motion';
import { createAvatar } from './avatar';
import { Text, Segmented, Chips, Honeypot } from '../fields';
import { submitSignup, isEmail } from '../signup';
import { wipeArrive, wipeTo } from '../wipe';

const AGENTS = [
  ['Operator', 'Hands-on work on your machine.'],
  ['Worker', 'Everyday chores, in the background.'],
  ['Scholar', 'Classroom, courses and study.'],
  ['Scribe', 'Notes and writing.'],
  ['Courier', 'Your mail.'],
  ['Scout', 'Web research through your real Chrome.'],
  ['Forge', 'Full software builds.'],
];
const LANES = [
  ['Local', 'A model on your own GPU answers first — chat, chores, research. It keeps working when the network is gone.', 1.1],
  ['Claude', 'The seven specialists and every build, through the Claude Agent SDK.', 2.2],
  ['Gemini', 'Optional. Takes the quick picture-reading turns off your Claude window.', 4.2],
];
const SHOTS = [
  ['desktop', 'Desktop', 'Your apps, your agents and one command bar. Nothing else on screen.'],
  ['focus', 'Focus', 'A session clears the desk and the avatar becomes an hourglass — violet for time spent, cyan for time left.'],
  ['notebook', 'Notebook', 'Ruled paper and fourteen block types, drawn by TUX’s own canvas engine.'],
  ['academics', 'Academics', 'Connect Google once: the Classroom backlog, what’s due soon and mail, in one place.'],
];
const COMMANDS = ['open classroom', 'make me study notes on chapter 4', 'build me a snake game', 'guide me through installing Python', 'tidy my downloads folder'];
const EMPTY = { name: '', email: '', windows: '', claude: '', gpu: '', uses: [], note: '', website: '' };
const back = (e) => { e.preventDefault(); wipeTo('../#work-tux', { color: '#EEECE7', ink: '#121212', label: 'Harsh Bavaskar' }); };

function Avatar({ mood, boot, className }) {
  const ref = useRef(null);
  const api = useRef(null);
  useEffect(() => {
    api.current = createAvatar(ref.current);
    return () => api.current.destroy();
  }, []);
  useEffect(() => { api.current.setMood(mood); }, [mood]);
  useEffect(() => { if (boot) api.current.boot(); }, [boot]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TopBar({ agent }) {
  const now = useClock();
  const time = now.toLocaleTimeString('en-GB', { hour12: false });
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
  const chip = useRef(null);
  useEffect(() => {
    if (agent) gsap.fromTo(chip.current, { autoAlpha: 0, x: -10, scale: 0.9 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' });
  }, [agent]);
  return (
    <header className="tx-top">
      <a className="tx-back" href="../#work-tux" onClick={back}>← Harsh Bavaskar</a>
      <span className="tx-brand"><i className="tx-brand__mark" aria-hidden="true" />TUX</span>
      {agent && (
        <span ref={chip} className={`tx-agent tx-agent--${agent.tone}`} aria-live="polite">
          <i aria-hidden="true" />{agent.name}<span className="tx-agent__what"> · {agent.text}</span>
        </span>
      )}
      <span className="tx-top__right">
        <span className="tx-pill">Early access</span>
        <span className="tx-clock"><b>{time}</b><span>{date}</span></span>
      </span>
    </header>
  );
}

function CommandBar({ onEmail, setMood }) {
  const [value, setValue] = useState('');
  const [reply, setReply] = useState('');
  const [hint, setHint] = useState(COMMANDS[0]);
  const input = useRef(null);

  // the placeholder types out things you could ask TUX
  useEffect(() => {
    if (reduced) return;
    let i = 0, alive = true;
    const run = async () => {
      while (alive) {
        const cmd = COMMANDS[i++ % COMMANDS.length];
        for (let k = 1; k <= cmd.length && alive; k++) { setHint(cmd.slice(0, k)); await new Promise((r) => setTimeout(r, 42)); }
        await new Promise((r) => setTimeout(r, 1600));
      }
    };
    run();
    return () => { alive = false; };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return input.current.focus();
    setMood('think');
    setTimeout(() => {
      if (isEmail(v)) {
        setReply('Got it — that’s in the form below. A few more details and you’re on the list.');
        onEmail(v);
        setValue('');
      } else {
        setReply('I’ll do that once you’re in. Leave your email here first.');
        setMood('listen');
      }
    }, 650);
  };

  return (
    <div className="tx-cmd-wrap">
      <form className="tx-cmd" onSubmit={submit}>
        <span className="tx-cmd__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        </span>
        <label className="sr-only" htmlFor="tx-cmd">Talk to TUX, or type your email to join early access</label>
        <input
          id="tx-cmd"
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setMood('listen')}
          onBlur={() => setMood('idle')}
          placeholder={`Try “${hint}”`}
          autoComplete="email"
        />
        <button type="submit" className="tx-cmd__send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
      <p className="tx-reply" aria-live="polite">{reply || '…or type your email to join early access.'}</p>
    </div>
  );
}

function JoinForm({ preset, setMood, setAgent, formRef }) {
  const [f, setF] = useState(() => ({ ...EMPTY, email: preset || '' }));
  const [err, setErr] = useState({});
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const done = useRef(null);
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };

  // arriving with an email from the command bar: go straight to the name
  useEffect(() => {
    if (preset) formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  }, [preset, formRef]);

  useEffect(() => {
    if (status === 'done') gsap.from(done.current.children, { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out' });
  }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    const bad = {};
    if (!f.name.trim()) bad.name = 'Tell me your name.';
    if (!isEmail(f.email)) bad.email = 'That email doesn’t look right.';
    setErr(bad);
    if (Object.keys(bad).length) {
      setMood('error');
      setTimeout(() => setMood('listen'), 1400);
      formRef.current.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setStatus('sending');
    setMood('think');
    setAgent({ name: 'Courier', text: 'sending your request', tone: 'violet' });
    try {
      const r = await submitSignup('tux', { ...f, name: f.name.trim(), email: f.email.trim() });
      setResult(r);
      setStatus('done');
      setMood('done');
      setAgent({ name: 'You’re in', text: r.position ? `#${r.position} in line` : 'request sent', tone: 'green' });
    } catch (x) {
      setMessage(x.message);
      setStatus('error');
      setMood('error');
      setAgent({ name: 'Stopped', text: 'try again', tone: 'rose' });
      setTimeout(() => setMood('idle'), 2400);
    }
  };

  if (status === 'done') {
    return (
      <div className="tx-done" ref={done} role="status">
        <p className="tx-mono">{result?.fallback ? 'Almost there' : 'Request received'}</p>
        <p className="tx-done__num">{result?.position ? `#${result.position}` : '✓'}</p>
        <p className="tx-done__text">
          {result?.fallback
            ? 'Your email app should have opened with your details. Send it and you’re on the list.'
            : result?.duplicate
              ? 'You were already on the list — your place is kept.'
              : `You’re on the early-access list. I’ll write to ${f.email.trim()} when your wave opens.`}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="tx-form"
      noValidate
      onSubmit={submit}
      onFocus={() => { setMood('listen'); setAgent((a) => (a?.name === 'Scribe' ? a : { name: 'Scribe', text: 'taking your details', tone: 'cyan' })); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMood('idle'); }}
    >
      <div className="tx-form__row">
        <Text label="Name" required value={f.name} onChange={set('name')} error={err.name} autoComplete="name" />
        <Text label="Email" type="email" required value={f.email} onChange={set('email')} error={err.email} autoComplete="email" />
      </div>
      <Segmented label="Windows" options={['Windows 11', 'Windows 10']} value={f.windows} onChange={set('windows')} name="windows" />
      <Segmented label="Claude plan" options={['Pro', 'Max', 'Team', 'None yet']} value={f.claude} onChange={set('claude')} name="claude" />
      <Segmented label="Graphics for the local model" options={['NVIDIA 8 GB+', 'Other GPU', 'None', 'Not sure']} value={f.gpu} onChange={set('gpu')} name="gpu" />
      <Chips label="What would you use it for" options={['Study', 'Coding', 'Writing', 'Research', 'Everything']} value={f.uses} onChange={set('uses')} />
      <Text label="Anything else" as="textarea" rows={3} value={f.note} onChange={set('note')} maxLength={500} />
      <Honeypot value={f.website} onChange={set('website')} />
      {status === 'error' && <p className="tx-form__error" role="alert">{message}</p>}
      <button type="submit" className="tx-submit" disabled={status === 'sending'}>
        <span>{status === 'sending' ? 'Sending…' : 'Request early access'}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <p className="tx-form__fine">One email when your wave opens. Nothing else, and never shared.</p>
    </form>
  );
}

export default function TuxPage() {
  const root = useRef(null);
  const formRef = useRef(null);
  const [mood, setMood] = useState('idle');
  const [agent, setAgent] = useState(null);
  const [boot, setBoot] = useState(0);
  const [preset, setPreset] = useState('');

  useLayoutEffect(() => {
    const stopScroll = initScroll();
    const arrived = wipeArrive();
    const ctx = gsap.context(() => {
      const title = SplitText.create('.tx-title', { type: 'lines', mask: 'lines' });
      const tl = gsap.timeline({ delay: arrived ? 0.55 : 0.15 });
      tl.call(() => setBoot((b) => b + 1))
        .from('.tx-top > *', { autoAlpha: 0, y: -12, stagger: 0.05, duration: 0.8 }, 0)
        .from('.tx-kicker', { autoAlpha: 0, y: 16, duration: 0.9 }, 0.1)
        .from(title.lines, { yPercent: 110, stagger: 0.1, duration: 1.3 }, 0.15)
        .from('.tx-cmd-wrap', { autoAlpha: 0, y: 40, duration: 1.2 }, 0.6)
        .call(() => setAgent({ name: 'Scout', text: 'watching for early-access waves', tone: 'blue' }), null, 1.4);
      if (reduced) tl.progress(1);

      // the seven share one thread: draw it through them as you scroll
      const cards = gsap.utils.toArray('.tx-agent-card');
      const thread = document.querySelector('.tx-thread path');
      // the line runs through the gaps above each row, so no card hides it,
      // and each card lights as the line reaches it
      let stops = [];
      const drawThread = () => {
        const grid = document.querySelector('.tx-agents__grid');
        const box = grid.getBoundingClientRect();
        const rects = cards.map((c) => { const r = c.getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top, w: r.width }; });
        const rows = [];
        rects.forEach((r, i) => {
          const row = rows.find((w) => Math.abs(w.y - r.y) < 4);
          (row || (rows.push({ y: r.y, items: [] }), rows[rows.length - 1])).items.push({ ...r, i });
        });
        const pts = [], at = [];
        rows.forEach((row, k) => {
          const y = row.y - 6;
          const items = k % 2 ? [...row.items].reverse() : row.items;
          if (k) {
            const edge = k % 2 ? Math.max(...row.items.map((r) => r.x + r.w)) + 6 : -6;
            pts.push([edge, rows[k - 1].y - 6], [edge, y]);
          }
          items.forEach((r) => { at[r.i] = pts.length; pts.push([r.x + 22, y]); });
        });
        let len = 0;
        const cum = pts.map((p, i) => (len += i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0));
        stops = at.map((k) => cum[k] / (len || 1));
        document.querySelector('.tx-thread').setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
        thread.setAttribute('d', pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
      };
      drawThread();
      ScrollTrigger.addEventListener('refreshInit', drawThread);
      gsap.fromTo(thread, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.tx-agents__grid',
          start: 'top 75%',
          end: 'bottom 55%',
          scrub: 0.5,
          onUpdate: (s) => cards.forEach((c, i) => c.classList.toggle('is-lit', s.progress >= stops[i] - 0.001)),
        },
      });
      gsap.from(cards, { y: 36, autoAlpha: 0, stagger: 0.06, duration: 1, scrollTrigger: { trigger: '.tx-agents__grid', start: 'top 85%' } });

      // three lanes feeding one transcript
      const log = document.querySelector('.tx-log');
      const lanes = gsap.timeline({ paused: true });
      gsap.utils.toArray('.tx-lane').forEach((lane, li) => {
        const every = LANES[li][2];
        lane.querySelectorAll('.tx-packet').forEach((p, k) => {
          lanes.fromTo(p, { left: '0%', autoAlpha: 0 }, {
            left: '100%',
            autoAlpha: 1,
            duration: 1.6,
            ease: 'power1.inOut',
            repeat: -1,
            repeatDelay: every * 2 - 1.6,
            onRepeat: () => {
              const line = document.createElement('li');
              line.innerHTML = `<b>${LANES[li][0].toLowerCase()}</b> ${['chat', 'build', 'read screen'][li]} · turn ${Math.floor(Math.random() * 90) + 10}`;
              log.prepend(line);
              gsap.from(line, { autoAlpha: 0, y: -10, duration: 0.5 });
              while (log.children.length > 6) log.lastChild.remove();
            },
          }, k * every + li * 0.4);
        });
      });
      ScrollTrigger.create({ trigger: '.tx-lanes', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? lanes.play() : lanes.pause()) });

      gsap.utils.toArray('.tx-reveal').forEach((el) => {
        gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray('.tx-h2').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } }),
        });
      });
      gsap.from('.tx-shot', { x: 80, autoAlpha: 0, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: '.tx-shots__row', start: 'top 85%' } });
      return () => ScrollTrigger.removeEventListener('refreshInit', drawThread);
    }, root);
    return () => { ctx.revert(); stopScroll(); };
  }, []);

  const joinWith = (email) => {
    setPreset(email);
    scrollTo('#join');
  };

  const scrollShots = (dir) => {
    const row = document.querySelector('.tx-shots__row');
    row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="tx" ref={root}>
      <TopBar agent={agent} />

      <section className="tx-hero">
        <p className="tx-kicker tx-mono">TUX OS · Release 0.5 · Windows 10 & 11</p>
        <h1 className="tx-title">The desktop<br />that does the work.</h1>
        <Avatar mood={mood} boot={boot} className="tx-avatar" />
        <CommandBar onEmail={joinWith} setMood={setMood} />
      </section>

      <section className="tx-sec tx-intro">
        <p className="tx-lede tx-reveal">
          TUX is a private, AI-first desktop that sits over Windows: a living avatar, one command bar, and a team of
          specialists that do the work while you think, study, write and build. <span>Early access opens in waves.</span>
        </p>
      </section>

      <section className="tx-sec tx-agents">
        <p className="tx-mono tx-reveal">Behind one voice</p>
        <h2 className="tx-h2">Seven specialists. One thread.</h2>
        <p className="tx-sub tx-reveal">They share a single session and a single conversation, so context never forks between them. Whoever is working shows up in the top bar.</p>
        <div className="tx-agents__grid">
          <svg className="tx-thread" aria-hidden="true" preserveAspectRatio="none"><path pathLength="1" strokeDasharray="1" /></svg>
          {AGENTS.map(([n, t], i) => (
            <article className="tx-agent-card" key={n}>
              <i className="tx-agent-card__dot" aria-hidden="true" />
              <span className="tx-mono">{String(i + 1).padStart(2, '0')}</span>
              <h3>{n}</h3>
              <p>{t}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tx-sec tx-lanes">
        <p className="tx-mono tx-reveal">How it thinks</p>
        <h2 className="tx-h2">Three lanes, one conversation.</h2>
        <div className="tx-lanes__body">
          <div className="tx-lanes__tracks">
            {LANES.map(([name, text]) => (
              <div className="tx-lane" key={name}>
                <div className="tx-lane__head"><b>{name}</b><span>{text}</span></div>
                <div className="tx-lane__track">
                  <i className="tx-packet" /><i className="tx-packet" />
                </div>
              </div>
            ))}
          </div>
          <div className="tx-transcript">
            <span className="tx-mono">One transcript</span>
            <ul className="tx-log" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="tx-sec tx-shots">
        <div className="tx-shots__head">
          <div>
            <p className="tx-mono tx-reveal">Inside</p>
            <h2 className="tx-h2">A desk you study inside.</h2>
          </div>
          <div className="tx-shots__nav">
            <button type="button" onClick={() => scrollShots(-1)} aria-label="Previous screen">←</button>
            <button type="button" onClick={() => scrollShots(1)} aria-label="Next screen">→</button>
          </div>
        </div>
        <div className="tx-shots__row">
          {SHOTS.map(([f, n, t]) => (
            <figure className="tx-shot" key={f}>
              <div className="tx-shot__img"><img src={`../work/tux/${f}.webp`} alt={`TUX ${n}`} loading="lazy" decoding="async" /></div>
              <figcaption><b>{n}</b> {t}</figcaption>
            </figure>
          ))}
          <figure className="tx-shot tx-shot--text">
            <div className="tx-shot__img"><p>“Guide me through installing Python.”</p></div>
            <figcaption><b>Vision</b> A card on your real desktop that gives one step at a time, with a close-up of exactly what to click — and waits until you’ve done it.</figcaption>
          </figure>
        </div>
      </section>

      <section className="tx-sec tx-join" id="join">
        <div className="tx-join__side">
          <p className="tx-mono tx-reveal">Early access</p>
          <h2 className="tx-h2">Put your name down.</h2>
          <p className="tx-sub tx-reveal">Access opens in small waves so every early user gets a working setup. You’ll need:</p>
          <ul className="tx-reqs tx-reveal">
            <li><b>Windows 10 or 11</b></li>
            <li><b>A Claude subscription</b> for the strong lane</li>
            <li><span>Optional</span> a graphics card, for the local model</li>
            <li><span>Optional</span> Google, for Classroom and Drive</li>
          </ul>
          <Avatar mood={mood} className="tx-avatar tx-avatar--small" />
        </div>
        <div className="tx-join__form">
          <JoinForm key={preset} preset={preset} setMood={setMood} setAgent={setAgent} formRef={formRef} />
        </div>
      </section>

      <footer className="tx-foot tx-mono">
        <span>TUX OS is closed-source, proprietary software. © 2026 Harsh Bavaskar.</span>
        <a href="../#work-tux" onClick={back}>← Back to the portfolio</a>
      </footer>
    </div>
  );
}
