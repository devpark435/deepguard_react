import { useState, useEffect } from 'react';

export default function GaugeChart({ value }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      let cur = 0;
      const tick = () => {
        cur = Math.min(cur + 1.5, value);
        setAnimated(Math.round(cur));
        if (cur < value) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  const R = 72;
  const C = 2 * Math.PI * R;
  const filled = (animated / 100) * C;
  const colorVal =
    animated >= 70 ? [238, 68, 63] : animated >= 40 ? [255, 170, 0] : [67, 183, 93];
  const color = `rgb(${colorVal.join(',')})`;
  const colorSoft = `rgba(${colorVal.join(',')},0.12)`;
  const label = animated >= 70 ? 'AI 생성 의심' : animated >= 40 ? '판단 유보' : '실제 이미지';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="72" fill={colorSoft} style={{ transition: 'fill 0.6s ease' }} />
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="90" cy="90" r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.5s ease' }}
        />
        <text x="90" y="82" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="34" fontWeight="700" fill={color} style={{ transition: 'fill 0.5s ease' }}>{animated}</text>
        <text x="90" y="96" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill={color} opacity="0.7">%</text>
        <text x="90" y="114" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill="var(--fg3)">{label}</text>
      </svg>
    </div>
  );
}
