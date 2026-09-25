// The HB monogram. The B shares the H's right stem; the crossbar is signal
// orange. With `guides`, it carries the drafting lines it was built on.
const INK = [
  'M4 3.5v21',
  'M13 3.5v21',
  'M13 3.5h4.5a5.25 5.25 0 0 1 0 10.5H13',
  'M13 14h5.5a5.25 5.25 0 0 1 0 10.5H13',
];

export default function Mark({ guides = false, className = '' }) {
  return (
    <svg className={`mark ${className}`} viewBox={guides ? '-8 -8 44 44' : '0 0 28 28'} aria-hidden="true">
      {guides && (
        <g className="mark__guides">
          {[3.5, 14, 24.5].map((y) => <path key={`h${y}`} className="mark__guide" pathLength="1" d={`M-6 ${y}H34`} />)}
          {[4, 13].map((x) => <path key={`v${x}`} className="mark__guide" pathLength="1" d={`M${x} -6V34`} />)}
          <circle className="mark__guide" pathLength="1" cx="17.5" cy="8.75" r="5.25" />
          <circle className="mark__guide" pathLength="1" cx="18.5" cy="19.25" r="5.25" />
          <path className="mark__guide mark__tick" pathLength="1" d="M16.5 8.75h2M17.5 7.75v2M17.5 19.25h2M18.5 18.25v2" />
          <path className="mark__guide" pathLength="1" d="M4 29.5H23.75M4 28.5v2M23.75 28.5v2" />
          <text className="mark__note" x="24.4" y="6">R 5.25</text>
          <text className="mark__note" x="4" y="33">HB / 26</text>
        </g>
      )}
      <g className="mark__glyph">
        <rect className="mark__frame" x="0" y="0" width="28" height="28" />
        {INK.map((d) => <path key={d} className="mark__ink" pathLength="1" d={d} />)}
        <path className="mark__bar" d="M4 14h9" />
      </g>
    </svg>
  );
}
