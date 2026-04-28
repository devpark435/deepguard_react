# 🛡️ DeepGuard AI

> **"지능형 딥페이크 탐지 및 분석 웹 애플리케이션"** <br/>
> 고도화된 다중 에이전트 AI 파이프라인으로 이미지의 진위 여부를 판별하고, 직관적인 분석 리포트를 제공합니다.

---

## 📖 프로젝트 소개

**DeepGuard AI**는 점차 정교해지는 딥페이크 및 AI 생성 이미지를 식별하고 분석하기 위해 개발된 웹 기반 서비스입니다. 
단순히 위변조 여부를 O/X로 알려주는 데 그치지 않고, 다중 에이전트(Multi-Agent) 기반의 정밀 분석을 거쳐 신뢰할 수 있는 구체적인 근거 기반 분석 리포트를 제공합니다.

### ✨ 주요 기능 (Key Features)

- **🖼️ 다양한 이미지 입력 방식 지원**
  - 파일 드래그 앤 드롭 (Drag & Drop) 및 로컬 이미지 파일 업로드
  - 이미지 URL 직접 입력 분석
- **⚡ Early-Exit 고속 필터**
  - 경량 AI 에이전트를 통해 명백한 딥페이크 단서를 조기에 감지하여 불필요한 분석을 방지하고 빠른 결과를 반환합니다.
- **🤖 다중 에이전트 앙상블 분석 파이프라인**
  1. **Fast Filter Agent:** 명백한 딥페이크 1차 스크리닝
  2. **Vision Agent:** 12개 항목 시각 특징 관찰 (텍스처, 비대칭, 광원 불일치 등)
  3. **Analysis Agent:** 앙상블 종합 판정 (Score 및 결정적 단서 도출)
  4. **RAG Agent:** 심층 분석이 필요한 경우 원본 이미지 추적 및 출처 탐색
- **📊 설명 가능한 분석 리포트 (XAI) 및 공유**
  - 단순 확률이 아닌 판정 근거와 추정 모델이 포함된 상세 리포트 제공
  - 생성된 분석 리포트를 고유 링크(TTL 7일)로 생성하여 타인과 손쉽게 공유 가능

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend (웹 UI 및 클라이언트)
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS (글래스모피즘, 마이크로 인터랙션 적용)

### Backend & AI (API 및 분석 로직)
- **Framework:** FastAPI (Python 3)
- **AI Integration:** OpenAI API (GPT-4o Vision)
- **Image Processing:** Pillow (PIL), python-multipart

### Database & Deployment
- **Database / Cache:** Upstash Redis (분석 리포트 임시 저장, 공유 링크 TTL 관리)
- **Deployment:** Vercel (프론트엔드 정적 호스팅 + Python Serverless Functions)

---

## 📂 프로젝트 구조 (Project Structure)

Vercel의 Serverless 배포 기준에 맞춰, 프론트엔드 정적 파일이 루트에 위치하고 백엔드 API 로직은 `api/` 폴더에 위치하도록 모노레포 형태로 구성되어 있습니다.

```text
deepguard_react_web/
├── api/                   # Python FastAPI 백엔드 (Vercel Serverless)
│   ├── index.py           # FastAPI 엔트리포인트
│   └── requirements.txt   # 백엔드 의존성
├── src/                   # React 프론트엔드 소스코드
│   ├── screens/           # UI 화면 컴포넌트
│   ├── App.jsx            # 메인 애플리케이션 진입점 및 상태 관리
│   └── index.css          # 글로벌 스타일 및 디자인 시스템
├── public/                # 파비콘 및 정적 에셋
├── package.json           # 노드 패키지 정보
└── vercel.json            # Vercel 배포 및 라우팅 설정 파일
```

---

## 🚀 배포 주소 및 실행 방법

### 🌐 실제 서비스 (배포 주소)
실제 서비스는 Vercel을 통해 배포되어 있으며, 아래 주소에서 바로 이용할 수 있습니다.
🔗 **[https://deepguard-react.vercel.app/](https://deepguard-react.vercel.app/)**

### 💻 로컬 실행 방법 (How to run locally)

**1. 환경 변수 설정**
`api/.env` 파일을 생성하고 아래 값을 입력합니다.
```env
OPENAI_API_KEY="your-openai-api-key"
KV_REST_API_URL="your-upstash-redis-url"
KV_REST_API_TOKEN="your-upstash-redis-token"
```

**2. Frontend 실행**
```bash
npm install
npm run dev
```

**3. Backend (API) 실행**
```bash
cd api
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```
> 프론트엔드는 `http://localhost:5173`, 백엔드는 `http://localhost:8000`으로 실행됩니다.

---

*본 프로젝트는 안전한 디지털 환경을 위한 미디어 진위 파악 기술 연구 및 구현을 목적으로 개발되었습니다.*
