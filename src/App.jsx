import { useState, useRef } from 'react';
import './App.css';
import HomeScreen from './screens/HomeScreen';
import AnalyzingScreen from './screens/AnalyzingScreen';
import ResultScreen from './screens/ResultScreen';

const API_BASE = 'http://localhost:8000';

const ANALYZE_STEPS = [
  '이미지 전처리 중...',
  '메타데이터 분석 중...',
  '텍스처 패턴 검사 중...',
  'GAN 아티팩트 탐지 중...',
  '얼굴 특징점 분석 중...',
  '모델 지문 식별 중...',
  '종합 평가 생성 중...',
];

export default function App() {
  const [screen, setScreen] = useState('home');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // 원본 URL (URL 입력 시)
  const [urlInput, setUrlInput] = useState('');
  const [inputMode, setInputMode] = useState('file');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const simulateProgress = async (apiCall) => {
    setScreen('analyzing');
    setAnalyzeProgress(0);
    setAnalyzeStep(0);
    setError(null);

    const apiPromise = apiCall();

    for (let i = 0; i < ANALYZE_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
      setAnalyzeStep(i);
      setAnalyzeProgress(Math.round((i + 1) / ANALYZE_STEPS.length * 85));
    }

    let result;
    try {
      result = await apiPromise;
    } catch (e) {
      setError(e.message);
      setScreen('home');
      return;
    }

    setAnalyzeProgress(100);
    await new Promise(r => setTimeout(r, 400));
    setAnalysisResult(result);
    setScreen('result');
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const mimeType = file.type.split(';')[0];
    setImageMimeType(mimeType);
    setImageUrl(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      // base64 순수값 추출 (data:image/...;base64, 제거)
      const b64 = e.target.result.split(',')[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);

    simulateProgress(async () => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `서버 오류 (${res.status})`);
      }
      return res.json();
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setImagePreview(url);
    setImageUrl(url);
    setImageBase64(null);
    setImageMimeType('image/jpeg');

    simulateProgress(async () => {
      const res = await fetch(`${API_BASE}/api/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `서버 오류 (${res.status})`);
      }
      return res.json();
    });
  };

  const reset = () => {
    setScreen('home');
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setImageUrl(null);
    setUrlInput('');
    setAnalysisResult(null);
    setAnalyzeProgress(0);
    setAnalyzeStep(0);
    setError(null);
  };

  if (screen === 'home') return (
    <>
      {error && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          ⚠ {error}
        </div>
      )}
      <HomeScreen
        inputMode={inputMode} setInputMode={setInputMode}
        urlInput={urlInput} setUrlInput={setUrlInput}
        isDragging={isDragging} setIsDragging={setIsDragging}
        handleFile={handleFile} handleDrop={handleDrop}
        handleUrlSubmit={handleUrlSubmit} fileInputRef={fileInputRef}
      />
    </>
  );

  if (screen === 'analyzing') return (
    <AnalyzingScreen
      imagePreview={imagePreview}
      progress={analyzeProgress}
      step={analyzeStep}
      steps={ANALYZE_STEPS}
    />
  );

  if (screen === 'result') return (
    <ResultScreen
      imagePreview={imagePreview}
      imageBase64={imageBase64}
      imageMimeType={imageMimeType}
      imageUrl={imageUrl}
      result={analysisResult}
      ragEnabled={analysisResult?.score >= 70 && analysisResult?.isDeepfake === true}
      onReset={reset}
    />
  );

  return null;
}
