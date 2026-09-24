import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, initScroll, scrollTo, reduced, touch } from '../../lib/motion';
import { Flip } from 'gsap/Flip';
import { Text, Segmented, Chips, Honeypot } from '../fields';
import { submitSignup, isEmail } from '../signup';
import { wipeArrive, wipeTo } from '../wipe';

gsap.registerPlugin(Flip);

// the demo week from Desk's own walkthrough
const SUBJECTS = [
  { name: 'Compiler Design', color: '#C3922E', task: 'Parse tree exercises', day: '23', dow: 'today', when: '11:59 PM', pos: [31, 4, -5], mpos: [3, 2, -4] },
  { name: 'Reinforcement Learning', color: '#B5452B', task: 'Implement value iteration for GridWorld', day: '24', dow: 'Thu', when: '11:59 PM', pos: [56, 0, 3], mpos: [51, 5, 4] },
  { name: 'Cloud Computing', color: '#2F6B57', task: 'Deploy a Flask app on Azure App Service', day: '25', dow: 'Fri', when: '11:59 PM', pos: [79, 12, -3], mpos: [2, 36, 3] },
  { name: 'Project Life Cycle Management', color: '#3F5F8F', task: 'Project charter and SID', day: '26', dow: 'Sat', when: '11:59 PM', pos: [33, 64, 4], mpos: [50, 39, -5] },
  { name: 'TY AI&ML Class Notices', color: '#3E7F7A', task: 'Mid-semester timetable posted', day: '27', dow: 'Sun', when: 'New post', pos: [57, 72, -4], mpos: [4, 70, 5] },
  { name: 'Deep Learning', color: '#7A4E7E', task: 'CNN lab: transfer learning', day: '29', dow: 'Tue', when: '11:59 PM', pos: [78, 60, 6], mpos: [51, 72, -3] },
];

const ROLES = {
  Student: {
    img: 'home',
    points: [
      'Every deadline, across every subject, on one list.',
      'Notes sorted by what they are — slides, videos, links and forms.',
      'Study notes written from the professor’s own lecture file.',
      'Exam countdowns and a revision timetable, by day or by subject.',
      'Doubts to teachers — anonymous if you like — and weekly feedback.',
    ],
  },
  Teacher: {
    img: 'faculty',
    points: [
      'Submission rates, work to grade and late work, per subject.',
      'A student-by-assignment grid of graded, late and missing work.',
      '“Download all” as one zip, named SID_Name_Assignment.',
      'Assignments posted straight to Classroom, with Drive attachments.',
      'A student tracker that puts the ones who need attention first.',
      'A doubts inbox, and anonymous feedback with a three-response threshold.',
    ],
  },
};

// "Prof. Anita Mehta" → "Anita"
const firstName = (n) => n.trim().split(/\s+/).find((w) => !/^(prof|dr|mr|mrs|ms|mx|sir)\.?$/i.test(w))?.replace(/\.$/, '') || n.trim();
const EMPTY = { name: '', email: '', institution: '', course: '', year: '', subjects: '', classroom: '', devices: [], website: '' };
const back = (e) => { e.preventDefault(); wipeTo('../#work-desk', { color: '#EEECE7', ink: '#121212', label: 'Harsh Bavaskar' }); };

function Check() {
  return (
    <svg className="dk-check" viewBox="0 0 24 24" aria-hidden="true">
      <path pathLength="1" d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

function Merge() {
  const stage = useRef(null);

  useLayoutEffect(() => {
    let cleanup = () => {};
    let lastW = innerWidth;
    const build = () => {
      const ctx = gsap.context(() => {
        const isles = gsap.utils.toArray('.dk-isle');
        const slots = gsap.utils.toArray('.dk-slot');
        const narrow = innerWidth < 900;
        isles.forEach((el, i) => gsap.set(el, { rotation: (narrow ? SUBJECTS[i].mpos : SUBJECTS[i].pos)[2] }));

        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        // measure the landing slots first, before the panel takes its starting offset
        isles.forEach((el, i) => {
          const at = 0.3 + i * 0.09;
          tl.add(Flip.fit(el, slots[i], { scale: false, duration: 0.75, ease: 'power3.inOut' }), at)
            .to(el.querySelector('.dk-isle__face'), { autoAlpha: 0, duration: 0.25 }, at + 0.15)
            .fromTo(el.querySelector('.dk-isle__row'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 0.4)
            .to(el, { borderRadius: 10, duration: 0.5 }, at + 0.2);
        });
        tl.fromTo('.dk-panel', { autoAlpha: 0, y: 40, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 }, 0.15)
          .to('.dk-cap--before', { autoAlpha: 0, y: -30, duration: 0.3 }, 0.5)
          .fromTo('.dk-cap--after', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.9)
          .fromTo('.dk-day', { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.3 }, 1.05)
          .fromTo('.dk-circle path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45 }, 1.3)
          .to({}, { duration: 0.35 });

        if (touch || narrow) {
          // phones: it plays by itself when it comes into view
          ScrollTrigger.create({ trigger: stage.current, start: 'top 55%', onEnter: () => tl.play(), onLeaveBack: () => tl.reverse() });
          tl.pause(0);
        } else {
          ScrollTrigger.create({ trigger: stage.current, start: 'top top', end: '+=170%', pin: true, scrub: 0.6, animation: tl });
        }
      }, stage);
      return () => ctx.revert();
    };
    cleanup = build();
    let t;
    const onResize = () => {
      if (touch && innerWidth === lastW) return;
      lastW = innerWidth;
      clearTimeout(t);
      t = setTimeout(() => { cleanup(); cleanup = build(); ScrollTrigger.refresh(); }, 250);
    };
    addEventListener('resize', onResize);
    return () => { removeEventListener('resize', onResize); clearTimeout(t); cleanup(); };
  }, []);

  return (
    <section className="dk-merge" ref={stage} aria-label="Six Classrooms become one desk">
      <div className="dk-caps">
        <div className="dk-cap dk-cap--before">
          <span className="dk-mono">Before</span>
          <p>Six subjects.<br />Six Classrooms.</p>
        </div>
        <div className="dk-cap dk-cap--after">
          <span className="dk-mono">After</span>
          <p>One desk.</p>
        </div>
      </div>

      <div className="dk-panel">
        <div className="dk-panel__head">
          <b>Next 7 days</b>
          <span className="dk-mono">6 due · <span className="dk-clash">0 clashes<svg className="dk-circle" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M8 22C10 8 58 3 95 7c22 3 24 20 5 27-26 9-80 7-92-5C2 23 12 12 30 9" /></svg></span></span>
        </div>
        {SUBJECTS.map((s) => (
          <div className="dk-row" key={s.name}>
            <span className="dk-day"><b>{s.day}</b>{s.dow}</span>
            <span className="dk-slot" />
          </div>
        ))}
      </div>

      {SUBJECTS.map((s) => (
        <article
          className="dk-isle"
          key={s.name}
          style={{ '--c': s.color, '--x': `${s.pos[0]}%`, '--yn': s.pos[1] / 72, '--mx': `${s.mpos[0]}%`, '--myn': s.mpos[1] / 72 }}
        >
          <div className="dk-isle__face">
            <i className="dk-isle__band" />
            <span className="dk-mono">Google Classroom</span>
            <b>{s.name}</b>
            <p>{s.task}</p>
            <span className="dk-mono dk-isle__due">{s.dow === 'today' ? 'Due today' : `Due ${s.dow}`} · {s.when}</span>
          </div>
          <div className="dk-isle__row" aria-hidden="true">
            <span><b>{s.task}</b><span className="dk-mono">{s.name} · {s.when}</span></span>
            <i className="dk-flag" />
          </div>
        </article>
      ))}
    </section>
  );
}

function Roles({ role, setRole }) {
  const list = useRef(null);
  const shot = useRef(null);
  useEffect(() => {
    const items = list.current.querySelectorAll('li');
    gsap.fromTo(items, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out' });
    gsap.fromTo(list.current.querySelectorAll('.dk-check path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.06, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    gsap.fromTo(shot.current, { autoAlpha: 0, y: 24, rotate: role === 'Teacher' ? 1.5 : -1.5 }, { autoAlpha: 1, y: 0, rotate: 0, duration: 1, ease: 'expo.out' });
  }, [role]);
  const r = ROLES[role];
  return (
    <section className="dk-sec dk-roles">
      <p className="dk-mono dk-reveal">Two sides of one desk</p>
      <div className="dk-switch" role="tablist" aria-label="Who is it for">
        {['Student', 'Teacher'].map((k) => (
          <button key={k} type="button" role="tab" aria-selected={role === k} className={role === k ? 'is-on' : ''} onClick={() => setRole(k)}>
            For {k.toLowerCase()}s
          </button>
        ))}
        <i className="dk-switch__mark" style={{ transform: `translateX(${role === 'Teacher' ? 100 : 0}%)` }} aria-hidden="true" />
      </div>
      <div className="dk-roles__body">
        <ul className="dk-points" ref={list} key={role}>
          {r.points.map((p) => <li key={p}><Check />{p}</li>)}
        </ul>
        <figure className="dk-frame" ref={shot}>
          <img src={`../work/desk/${r.img}.webp`} alt={`Desk ${role === 'Teacher' ? 'faculty' : 'student'} view`} width="1440" height="900" loading="lazy" decoding="async" />
        </figure>
      </div>
    </section>
  );
}

function JoinForm({ role, onRole }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const form = useRef(null);
  const done = useRef(null);
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };

  useEffect(() => {
    if (status !== 'done') return;
    gsap.timeline()
      .from(done.current.querySelectorAll('.dk-done > *'), { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out' })
      .fromTo(done.current.querySelector('.dk-ring circle'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2);
  }, [status]);

  const student = role === 'Student';
  const teacher = role === 'Teacher';

  const submit = async (e) => {
    e.preventDefault();
    const bad = {};
    if (!role) bad.role = 'Desk testing is for students and teachers — pick one.';
    if (!f.name.trim()) bad.name = 'Tell me your name.';
    if (!isEmail(f.email)) bad.email = 'That email doesn’t look right.';
    if (!f.institution.trim()) bad.institution = 'Which college or university?';
    if (student && !f.course.trim()) bad.course = 'Which course are you in?';
    if (student && !f.year) bad.year = 'Pick your year.';
    if (teacher && !f.course.trim()) bad.course = 'Which department?';
    setErr(bad);
    if (Object.keys(bad).length) {
      gsap.fromTo(form.current, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      form.current.querySelector('[aria-invalid="true"], .has-error button')?.focus();
      return;
    }
    setStatus('sending');
    const atlas = /atlas/i.test(f.institution) || /atlas/i.test(f.email.split('@')[1] || '');
    try {
      const r = await submitSignup('desk', {
        ...f,
        role,
        name: f.name.trim(),
        email: f.email.trim(),
        year: student ? f.year : '',
        subjects: teacher ? f.subjects : '',
        priority: atlas ? 'Atlas' : '',
      });
      setResult(r);
      setStatus('done');
    } catch (x) {
      setMessage(x.message);
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div ref={done} role="status">
        <div className="dk-done">
          <span className="dk-mono">{result?.fallback ? 'Almost there' : 'You’re in the queue'}</span>
          <div className="dk-ring">
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" pathLength="1" /></svg>
            <b>{result?.position ? `#${result.position}` : '✓'}</b>
          </div>
          <p>
            {result?.fallback
              ? 'Your email app should have opened with your details. Send it and your seat is saved.'
              : result?.duplicate
                ? 'You were already signed up — your seat is saved.'
                : `Thanks, ${firstName(f.name)}. I’ll write to ${f.email.trim()} when your seat in the test opens.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form ref={form} className="dk-form" noValidate onSubmit={submit}>
      <Segmented label="I am a" options={['Student', 'Teacher']} value={role} onChange={(v) => { onRole(v); setErr((e) => ({ ...e, role: '' })); }} error={err.role} required name="role" />
      <div className="dk-form__row">
        <Text label="Name" required value={f.name} onChange={set('name')} error={err.name} autoComplete="name" />
        <Text label="Email" type="email" required value={f.email} onChange={set('email')} error={err.email} autoComplete="email" hint="Your college email gets you seated sooner." />
      </div>
      <Text label="College or university" required value={f.institution} onChange={set('institution')} error={err.institution} placeholder="Atlas Skilltech University" autoComplete="organization" />
      {student && (
        <div className="dk-form__row dk-form__reveal" key="s">
          <Text label="Course" required value={f.course} onChange={set('course')} error={err.course} placeholder="BTech CS — AI & ML" />
          <Segmented label="Year" options={['1', '2', '3', '4', '5']} value={f.year} onChange={set('year')} error={err.year} required name="year" />
        </div>
      )}
      {teacher && (
        <div className="dk-form__row dk-form__reveal" key="t">
          <Text label="Department" required value={f.course} onChange={set('course')} error={err.course} placeholder="Computer Science" />
          <Text label="Subjects you teach" value={f.subjects} onChange={set('subjects')} placeholder="Cloud Computing, Deep Learning" />
        </div>
      )}
      <Segmented label="Does your college use Google Classroom?" options={['Yes', 'No', 'Not sure']} value={f.classroom} onChange={set('classroom')} name="classroom" />
      <Chips label="You’d test on" options={['Android', 'iPhone', 'Laptop', 'Tablet']} value={f.devices} onChange={set('devices')} />
      <Honeypot value={f.website} onChange={set('website')} />
      {status === 'error' && <p className="dk-form__error" role="alert">{message}</p>}
      <button type="submit" className="dk-submit" disabled={status === 'sending'}>
        <span>{status === 'sending' ? 'Saving your seat…' : 'Join the Desk test'}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <p className="dk-form__fine">Only students and teachers are seated. One email when your seat opens — nothing else, never shared.</p>
    </form>
  );
}

export default function DeskPage() {
  const root = useRef(null);
  const [role, setRole] = useState('Student');
  const [formRole, setFormRole] = useState('');

  useLayoutEffect(() => {
    const stopScroll = initScroll();
    const arrived = wipeArrive();
    const ctx = gsap.context(() => {
      const title = SplitText.create('.dk-title', { type: 'lines', mask: 'lines' });
      const tl = gsap.timeline({ delay: arrived ? 0.55 : 0.15 });
      tl.from('.dk-top > *', { autoAlpha: 0, y: -12, stagger: 0.05, duration: 0.8 }, 0)
        .from('.dk-kicker', { autoAlpha: 0, y: 16, duration: 0.9 }, 0.1)
        .from(title.lines, { yPercent: 110, stagger: 0.1, duration: 1.3 }, 0.15)
        .fromTo('.dk-hl', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.9)
        .from('.dk-hero__sub, .dk-cta > *', { autoAlpha: 0, y: 24, stagger: 0.08, duration: 1 }, 0.8)
        .fromTo('.dk-arrow path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 1.2);
      if (reduced) tl.progress(1);

      gsap.utils.toArray('.dk-reveal').forEach((el) => {
        gsap.from(el, { y: 36, autoAlpha: 0, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray('.dk-h2').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } }),
        });
      });
    }, root);
    return () => { ctx.revert(); stopScroll(); };
  }, []);

  const join = (r) => { setRole(r); setFormRole(r); scrollTo('#join'); };

  return (
    <div className="dk" ref={root}>
      <header className="dk-top">
        <a className="dk-back" href="../#work-desk" onClick={back}>← Harsh Bavaskar</a>
        <img className="dk-logo" src="../work/desk/logo.webp" alt="Desk" width="106" height="30" />
        <span className="dk-pill">Testing · early access</span>
      </header>

      <section className="dk-hero">
        <p className="dk-kicker dk-mono">For students and teachers</p>
        <h1 className="dk-title">
          Every subject’s Google Classroom,{' '}
          <span className="dk-mark"><i className="dk-hl" aria-hidden="true" />on one desk.</span>
        </h1>
        <p className="dk-hero__sub">Desk is being tested by students and teachers before it opens up. Take a seat in the test and help shape it.</p>
        <div className="dk-cta">
          <button type="button" className="dk-btn" onClick={() => join('Student')}>I’m a student <span aria-hidden="true">→</span></button>
          <button type="button" className="dk-btn dk-btn--ghost" onClick={() => join('Teacher')}>I’m a teacher <span aria-hidden="true">→</span></button>
        </div>
        <svg className="dk-arrow" viewBox="0 0 60 90" aria-hidden="true">
          <path pathLength="1" d="M30 4c-6 18 8 30 2 48-3 9-4 16-2 30M20 70l10 13 10-13" />
        </svg>
      </section>

      <Merge />

      <Roles role={role} setRole={setRole} />

      <section className="dk-sec dk-install">
        <p className="dk-mono dk-reveal">Where it runs</p>
        <h2 className="dk-h2">Installs from the browser. No app store.</h2>
        <div className="dk-devices dk-reveal">
          {[['Android', 'Tap Install when Desk offers'], ['iPhone', 'Share → Add to Home Screen'], ['Windows & macOS', 'The install icon in the address bar']].map(([n, t]) => (
            <div key={n}><b>{n}</b><span>{t}</span></div>
          ))}
        </div>
      </section>

      <section className="dk-sec dk-join" id="join">
        <div className="dk-join__side">
          <p className="dk-mono dk-reveal">Testing early access</p>
          <h2 className="dk-h2">Take a seat in the test.</h2>
          <p className="dk-sub dk-reveal">Seats go to students and teachers, in small groups, so every tester gets a working desk and a direct line for feedback.</p>
        </div>
        <JoinForm role={formRole} onRole={(r) => { setFormRole(r); setRole(r); }} />
      </section>

      <footer className="dk-foot dk-mono">
        <span>Desk is closed source. © 2026 Harsh Bavaskar and Anisa D’souza. Google Classroom is a trademark of Google LLC.</span>
        <a href="../#work-desk" onClick={back}>← Back to the portfolio</a>
      </footer>
    </div>
  );
}
