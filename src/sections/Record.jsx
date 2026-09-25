import { record } from '../data';

export default function Record() {
  return (
    <section id="record" className="rc" data-chapter data-theme="lime">
      <div className="wrap">
        <div className="sec-head mono"><span>06 / Record</span><span className="dim">Awards and languages</span></div>
        <ul className="rc__list">
          {record.map((r) => (
            <li className="rc__row" key={r.v}>
              <i className="rule" data-reveal="rule" />
              <span className="rc__k mono" data-reveal="fade">{r.k}</span>
              <span className="rc__v" data-reveal="fade">{r.v}</span>
              <span className="rc__d" data-reveal="fade">{r.d}</span>
              <span className="rc__y mono" data-reveal="fade">{r.y}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
