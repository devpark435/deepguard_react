import { useState, useEffect } from 'react';

export default function ProgressBar({ value, color }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', flex: 1, position: 'relative' }}>
      <div style={{
        height: '100%',
        width: `${w}%`,
        borderRadius: 99,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
        boxShadow: `0 0 8px ${color}55`,
      }} />
    </div>
  );
}
