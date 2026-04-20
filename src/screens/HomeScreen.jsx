import { useState } from 'react';
import DotGrid from '../components/DotGrid';
import Icon from '../components/Icon';

export default function HomeScreen({
  inputMode, setInputMode,
  urlInput, setUrlInput,
  isDragging, setIsDragging,
  handleFile, handleDrop,
  handleUrlSubmit, fileInputRef,
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <DotGrid />
      </div>

      <header style={{ position: 'relative', zIndex: 10, padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="logo" size={26} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.3px' }}>
          Deep<span style={{ color: 'var(--primary)' }}>Guard</span>
        </span>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 14px', marginBottom: 32, boxShadow: '0 1px 6px rgba(19,25,39,0.07)', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 0 3px rgba(67,183,93,0.2)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg2)' }}>탐지 엔진 가동 중</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px,5vw,62px)', fontWeight: 700, lineHeight: 1.12, color: 'var(--fg)', letterSpacing: '-2px', textAlign: 'center', marginBottom: 18, animation: 'fadeIn 0.5s ease 0.05s both' }}>
          AI 이미지·딥페이크<br />
          <span style={{ color: 'var(--primary)' }}>즉시 탐지</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7, maxWidth: 440, textAlign: 'center', marginBottom: 48, animation: 'fadeIn 0.5s ease 0.1s both' }}>
          이미지를 올리거나 URL을 붙여넣으면<br />생성 여부, 사용 모델, 의심 신호를 분석합니다.
        </p>

        <div style={{
          background: 'var(--surface)', borderRadius: 24,
          boxShadow: '0px 16px 40px -6px rgba(19,25,39,0.12), 0px 8px 16px -6px rgba(19,25,39,0.08)',
          padding: 28, width: '100%', maxWidth: 520,
          animation: 'fadeIn 0.5s ease 0.15s both',
          border: '1px solid rgba(229,231,234,0.8)',
        }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
            {[['file', '파일 업로드'], ['url', 'URL 입력']].map(([v, l]) => (
              <button key={v} onClick={() => setInputMode(v)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: inputMode === v ? 'var(--surface)' : 'transparent',
                color: inputMode === v ? 'var(--fg)' : 'var(--fg3)',
                boxShadow: inputMode === v ? '0 1px 6px rgba(0,0,0,0.09)' : 'none',
                transition: 'all 0.2s',
              }}>{l}</button>
            ))}
          </div>

          {inputMode === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 16, padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
                background: isDragging ? 'var(--primary-soft)' : 'transparent',
                transition: 'all 0.2s', userSelect: 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {isDragging && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(78,97,246,0.07), rgba(78,97,246,0.03))', borderRadius: 14 }} />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              <div style={{
                width: 56, height: 56,
                background: isDragging ? 'var(--primary)' : 'var(--bg)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                border: `1.5px solid ${isDragging ? 'transparent' : 'var(--border)'}`,
                transition: 'all 0.2s',
                transform: isDragging ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
                boxShadow: isDragging ? '0 8px 20px rgba(78,97,246,0.3)' : 'none',
              }}>
                <Icon name="upload" size={24} color={isDragging ? 'white' : 'var(--fg2)'} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', marginBottom: 5 }}>
                {isDragging ? '여기에 놓으세요' : '드래그하거나 클릭해서 업로드'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--fg3)' }}>PNG · JPG · WEBP · GIF · 최대 20MB</p>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Icon name="link" size={17} color="var(--fg3)" />
                </div>
                <input
                  type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 14px 14px 42px',
                    border: '1.5px solid var(--border)', borderRadius: 12,
                    fontSize: 14, fontFamily: 'Inter, sans-serif', color: 'var(--fg)',
                    background: 'var(--bg)', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(78,97,246,0.12)'; e.target.style.background = 'var(--surface)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg)'; }}
                />
              </div>
              <button onClick={handleUrlSubmit} style={{
                width: '100%', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
                boxShadow: '0 4px 14px rgba(78,97,246,0.35)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Icon name="search" size={16} color="white" /> 분석하기
              </button>
            </div>
          )}

          {inputMode === 'file' && (
            <>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--fg3)', fontWeight: 500 }}>또는</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <button
                onClick={() => setInputMode('url')}
                style={{ width: '100%', marginTop: 12, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'transparent', color: 'var(--fg2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg2)'; }}
              >
                <Icon name="link" size={15} color="currentColor" /> URL로 입력하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
