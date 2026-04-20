export default function AnalyzingScreen({ imagePreview, progress, step, steps }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const filled = (progress / 100) * C;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: imagePreview ? '1fr 1fr' : '1fr', background: 'var(--bg)' }}>
      {imagePreview && (
        <div style={{ position: 'relative', background: 'rgb(10,12,20)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '100vh' }}>
          <img src={imagePreview} alt="analyzing"
            style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', opacity: 0.55, display: 'block' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(78,97,246,0.9) 50%, transparent 100%)', animation: 'scanLine 2s ease-in-out infinite', boxShadow: '0 0 20px rgba(78,97,246,0.6), 0 0 40px rgba(78,97,246,0.2)' }} />
          {[
            { top: 16, left: 16, bt: 'borderTop', bs: 'borderLeft' },
            { top: 16, right: 16, bt: 'borderTop', bs: 'borderRight' },
            { bottom: 16, left: 16, bt: 'borderBottom', bs: 'borderLeft' },
            { bottom: 16, right: 16, bt: 'borderBottom', bs: 'borderRight' },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              ...(c.top !== undefined ? { top: c.top } : { bottom: c.bottom }),
              ...(c.left !== undefined ? { left: c.left } : { right: c.right }),
              width: 20, height: 20,
              [c.bt]: '2px solid rgba(78,97,246,0.7)',
              [c.bs]: '2px solid rgba(78,97,246,0.7)',
            }} />
          ))}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,12,20,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(78,97,246,0.3)', borderRadius: 99, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>SCANNING</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', animation: 'fadeIn 0.4s ease' }}>
        <div style={{ position: 'relative', marginBottom: 36 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--primary)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.4s ease', filter: 'drop-shadow(0 0 6px rgba(78,97,246,0.5))' }}
            />
            <text x="60" y="56" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="22" fontWeight="700" fill="var(--fg)">{progress}</text>
            <text x="60" y="70" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="var(--fg3)">%</text>
          </svg>
        </div>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 6, letterSpacing: '-0.3px' }}>분석 중</div>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, minHeight: 20 }}>{steps[step] || '처리 중...'}</div>
        </div>

        <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', opacity: i > step ? 0.3 : 1, transition: 'opacity 0.4s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)',
                    transition: 'background 0.3s',
                    boxShadow: active ? '0 0 0 4px rgba(78,97,246,0.15)' : 'none',
                  }}>
                    {done
                      ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><path d="M5 12l4 4L19 7" /></svg>
                      : active ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} /> : null
                    }
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 1, height: 14, background: done ? 'var(--success)' : 'var(--border)', marginTop: 2, transition: 'background 0.3s' }} />
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'var(--fg)' : 'var(--fg2)', paddingTop: 1, lineHeight: 1.4 }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
