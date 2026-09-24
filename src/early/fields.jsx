import { useId } from 'react';

// Form parts shared by the early-access pages; each page styles them itself.

export function Text({ label, hint, error, value, onChange, required, type = 'text', as = 'input', ...rest }) {
  const id = useId();
  const Tag = as;
  return (
    <div className={`f f--text${error ? ' has-error' : ''}`}>
      <label className="f__label" htmlFor={id}>
        {label}
        {required ? <span className="f__req" aria-hidden="true"> *</span> : <span className="f__opt"> optional</span>}
      </label>
      <Tag
        id={id}
        className="f__input"
        type={as === 'input' ? type : undefined}
        value={value}
        required={required}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {(error || hint) && <p className="f__hint" id={`${id}-hint`}>{error || hint}</p>}
    </div>
  );
}

// One choice from a few — a row of buttons with a sliding marker.
export function Segmented({ label, options, value, onChange, error, required, name }) {
  const id = useId();
  const i = options.indexOf(value);
  return (
    <div className={`f f--seg${error ? ' has-error' : ''}`} role="radiogroup" aria-labelledby={id} aria-required={required}>
      <span className="f__label" id={id}>
        {label}
        {required ? <span className="f__req" aria-hidden="true"> *</span> : <span className="f__opt"> optional</span>}
      </span>
      <div className="seg" style={{ '--n': options.length, '--i': Math.max(0, i) }} data-empty={i < 0}>
        <i className="seg__mark" aria-hidden="true" />
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            name={name}
            aria-checked={o === value}
            className={`seg__opt${o === value ? ' is-on' : ''}`}
            onClick={() => onChange(o === value && !required ? '' : o)}
          >
            {o}
          </button>
        ))}
      </div>
      {error && <p className="f__hint">{error}</p>}
    </div>
  );
}

// Any number of choices.
export function Chips({ label, options, value, onChange }) {
  const id = useId();
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div className="f f--chips" role="group" aria-labelledby={id}>
      <span className="f__label" id={id}>{label}<span className="f__opt"> optional · pick any</span></span>
      <div className="chipset">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value.includes(o)} className={`chipset__opt${value.includes(o) ? ' is-on' : ''}`} onClick={() => toggle(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// Hidden from people, filled by bots.
export function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>Website<input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} /></label>
    </div>
  );
}
