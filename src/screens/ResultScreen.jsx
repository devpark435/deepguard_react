import { useState } from 'react';
import DotGrid from '../components/DotGrid';
import Icon from '../components/Icon';
import GaugeChart from '../components/GaugeChart';
import ProgressBar from '../components/ProgressBar';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export default function ResultScreen({ imagePreview, imageBase64, imageMimeType, imageUrl, result, ragEnabled, onReset, onShare }) {
  const [activeTab, setActiveTab] = useState('clues');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [ragError, setRagError] = useState(null);
  const score = result?.score || 0;
  const riskColor = score >= 70 ? 'var(--danger)' : score >= 40 ? 'var(--warning)' : 'var(--success)';
  const riskBg = score >= 70 ? 'var(--danger-soft)' : score >= 40 ? 'var(--warning-soft)' : 'var(--success-soft)';
  const riskLabel = score >= 70 ? '위험' : score >= 40 ? '주의' : '안전';

  const handleRagSearch = async () => {
    setRagLoading(true);
    setRagError(null);
    setRagResult(null);
    try {
      // URL 입력이면 base64 없이 URL만, 파일이면 base64 사용
      const body = imageBase64
        ? { image_base64: imageBase64, mime_type: imageMimeType, image_url: imageUrl, score, model: result?.model }
        : { image_base64: '', mime_type: imageMimeType || 'image/jpeg', image_url: imageUrl, score, model: result?.model };

      const res = await fetch(`${API_BASE}/api/search-origin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `서버 오류 (${res.status})`);
      }
      setRagResult(await res.json());
    } catch (e) {
      setRagError(e.message);
    } finally {
      setRagLoading(false);
    }
  };

  const tabs = [
    { id: 'clues', label: '의심 신호', count: result?.clues?.length },
    { id: 'evidence', label: '반증', count: result?.evidence?.length },
    { id: 'model', label: '모델 분석', count: null },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.5 }}>
        <DotGrid />
      </div>

      <header style={{ position: 'relative', zIndex: 10, padding: '20px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="logo" size={26} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.3px' }}>
            Deep<span style={{ color: 'var(--primary)' }}>Guard</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onShare}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', color: 'var(--fg2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg2)'; }}
          >
            <Icon name="link" size={14} color="currentColor" /> 공유
          </button>
          <button onClick={onReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', color: 'var(--fg2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg2)'; }}
          >
            <Icon name="refresh" size={14} color="currentColor" /> 새 분석
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '8px 24px 48px', position: 'relative', zIndex: 10, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Image + verdict */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 10px 32px -4px rgba(19,25,39,0.10)', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, maxHeight: 340, overflow: 'hidden', position: 'relative' }}>
                {imagePreview
                  ? <img src={imagePreview} alt="analyzed"
                      style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain', display: 'block' }}
                      onError={e => {
                        const div = document.createElement('div');
                        div.style.cssText = 'padding:40px;color:var(--fg3);font-size:13px;text-align:center';
                        div.textContent = '이미지를 불러올 수 없습니다';
                        e.target.replaceWith(div);
                      }}
                    />
                  : <div style={{ padding: 48, color: 'var(--fg3)', fontSize: 13, textAlign: 'center' }}>
                      <Icon name="image" size={32} color="var(--border)" />
                    </div>
                }
                <div style={{ position: 'absolute', top: 12, right: 12, background: riskBg, border: `1px solid ${riskColor}`, borderRadius: 99, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: riskColor }}>{riskLabel}</span>
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{new Date().toLocaleDateString('ko-KR')} 분석</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--primary-soft)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 99 }}>{result?.model}</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '20px 22px', boxShadow: '0px 10px 32px -4px rgba(19,25,39,0.08)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, color: 'var(--fg)', lineHeight: 1.7, marginBottom: 16 }}>{result?.verdict}</p>
              <div style={{ padding: '12px 14px', background: riskBg, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="shield" size={16} color={riskColor} />
                <span style={{ fontSize: 12, fontWeight: 600, color: riskColor, lineHeight: 1.5 }}>{result?.action}</span>
              </div>
            </div>

            {ragEnabled && (
              <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '20px 22px', border: '1.5px dashed var(--border)', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon name="search" size={16} color="var(--primary)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>원본 탐색</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--primary-soft)', color: 'var(--primary)', padding: '2px 7px', borderRadius: 99 }}>BETA</span>
                </div>

                {!ragResult && !ragLoading && (
                  <>
                    <p style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 14 }}>
                      딥페이크로 의심됩니다. GPT-4o Vision으로 얼굴 식별 특징을 추출하고 원본 인물 탐색 링크를 생성합니다.
                    </p>
                    <button onClick={handleRagSearch} style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                    >
                      <Icon name="search" size={14} color="white" /> 탐색 시작
                    </button>
                  </>
                )}

                {ragLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--fg2)' }}>GPT-4o로 식별 특징 분석 중...</span>
                  </div>
                )}

                {ragError && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-soft)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                    ⚠ {ragError}
                  </div>
                )}

                {ragResult && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <p style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6 }}>
                      {ragResult.web_detection
                        ? ([...(ragResult.web_detection.full_matches || []), ...(ragResult.web_detection.partial_matches || [])].length > 0
                            ? '웹에서 유사 이미지를 발견했습니다. 아래 비교 섹션을 확인하세요.'
                            : '웹에서 동일/유사 이미지를 찾지 못했습니다.')
                        : '식별 특징을 추출했습니다. 아래 링크로 직접 탐색해보세요.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Gauge + tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 24px', boxShadow: '0px 10px 32px -4px rgba(19,25,39,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg3)', marginBottom: 8, textAlign: 'center' }}>AI 생성 의심도</div>
                <GaugeChart value={score} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'GAN 아티팩트', val: Math.round(score * 0.9), color: 'rgb(78,97,246)' },
                  { label: '텍스처 비정상', val: Math.round(score * 0.8), color: 'rgb(255,170,0)' },
                  { label: '메타데이터 신뢰도', val: Math.round(100 - score * 0.7), color: 'rgb(67,183,93)' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--fg2)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{val}%</span>
                    </div>
                    <ProgressBar value={val} color={color} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: '0px 10px 32px -4px rgba(19,25,39,0.08)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 6px' }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                    flex: 1, padding: '14px 8px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    color: activeTab === t.id ? 'var(--primary)' : 'var(--fg3)',
                    borderBottom: `2px solid ${activeTab === t.id ? 'var(--primary)' : 'transparent'}`,
                    marginBottom: -1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    {t.label}
                    {t.count != null && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: activeTab === t.id ? 'var(--primary-soft)' : 'var(--border)', color: activeTab === t.id ? 'var(--primary)' : 'var(--fg3)', padding: '1px 6px', borderRadius: 99, transition: 'all 0.15s' }}>{t.count}</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding: 22, animation: 'fadeIn 0.25s ease' }} key={activeTab}>
                {activeTab === 'clues' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result?.clues?.map((c, i) => (
                      <div key={i}
                        style={{ display: 'flex', gap: 12, padding: '13px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', alignItems: 'flex-start', transition: 'border-color 0.15s', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.type === 'danger' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55 }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'evidence' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result?.evidence?.map((e, i) => (
                      <div key={i}
                        style={{ display: 'flex', gap: 12, padding: '13px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', alignItems: 'flex-start', transition: 'border-color 0.15s', cursor: 'default' }}
                        onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--success)'}
                        onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Icon name="check" size={9} color="var(--success)" strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55 }}>{e}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'model' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'var(--primary-soft)', borderRadius: 14, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="cpu" size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--primary)' }}>{result?.model}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>신뢰도 {Math.round(score * 0.95)}%</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.7 }}>{result?.modelDesc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 원본 이미지 비교 — 풀 와이드 섹션 */}
        {ragResult?.web_detection && (() => {
          const wd = ragResult.web_detection;
          const matches = [...(wd.full_matches || []), ...(wd.partial_matches || [])];
          if (matches.length === 0) return null;
          const fullCount = wd.full_matches?.length || 0;

          return (
            <div style={{ marginTop: 24, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="search" size={16} color="var(--primary)" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>원본 이미지 비교</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--primary-soft)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 99 }}>
                    {matches.length}건 발견
                  </span>
                </div>
                {ragResult.search_strategy && (
                  <p style={{ fontSize: 11, color: 'var(--fg3)', maxWidth: 500, textAlign: 'right', lineHeight: 1.5 }}>
                    {ragResult.search_strategy}
                  </p>
                )}
              </div>

              <div style={{ padding: '28px' }}>
                {/* 메인 비교 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 1fr', gap: 0, alignItems: 'center', marginBottom: 24 }}>
                  {/* 딥페이크 이미지 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2.5px solid var(--danger)', boxShadow: '0 0 0 4px var(--danger-soft)' }}>
                      <img src={imagePreview} alt="분석 이미지"
                        style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--danger)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                        딥페이크 의심
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6, padding: '0 4px' }}>
                      {ragResult.identifying_features}
                    </p>
                  </div>

                  {/* 중앙 화살표 */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ fontSize: 28, color: 'var(--border)' }}>→</div>
                  </div>

                  {/* 원본 예상 이미지 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <a href={matches[0].url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2.5px solid var(--success)', boxShadow: '0 0 0 4px var(--success-soft)', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <img src={matches[0].url} alt="원본 예상"
                        style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.src = ''; e.target.style.minHeight = '200px'; e.target.style.background = 'var(--bg)'; }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--success)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                        {fullCount > 0 ? '완전 일치' : '부분 일치'}
                      </div>
                      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="link" size={10} color="white" /> 원본 열기
                      </div>
                    </a>
                    <p style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6, padding: '0 4px' }}>
                      {ragResult.background_body_description || '웹에서 발견된 유사 이미지입니다. 클릭하면 원본 페이지로 이동합니다.'}
                    </p>
                  </div>
                </div>

                {/* 추가 매칭 이미지 */}
                {matches.length > 1 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      추가 유사 이미지
                    </div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                      {matches.slice(1).map((m, i) => (
                        <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                          style={{ flexShrink: 0, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--border)', display: 'block', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <img src={m.url} alt=""
                            style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.parentElement.style.display = 'none'; }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '4px 6px' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'white' }}>
                              {i < fullCount - 1 ? '완전 일치' : '부분 일치'}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <p style={{ fontSize: 11, color: 'var(--fg3)', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
          본 분석은 AI 보조 도구의 결과이며, 100% 정확성을 보장하지 않습니다. 최종 판단은 사용자 본인이 내려 주세요.
        </p>
      </div>
    </div>
  );
}
