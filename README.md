# 🛡️ DeepGuard AI

> **"지능형 딥페이크 탐지 및 분석 웹 애플리케이션"** <br/>
> 고도화된 AI 기술로 이미지의 진위 여부를 판별하고, 딥페이크 아티팩트를 정밀 분석하여 사용자에게 직관적인 결과를 제공합니다.

---

## 📖 프로젝트 소개

**DeepGuard AI**는 점차 정교해지는 딥페이크 및 AI 생성 이미지를 식별하고 분석하기 위해 개발된 웹 기반 서비스입니다. 
단순히 위변조 여부를 O/X로 알려주는 데 그치지 않고, 여러 단계의 정밀 분석(메타데이터, 텍스처 패턴, GAN 아티팩트, 얼굴 특징점 등)을 거쳐 신뢰할 수 있는 구체적인 분석 리포트를 제공합니다.

### ✨ 주요 기능 (Key Features)

- **🖼️ 다양한 이미지 입력 방식 지원**
  - 파일 드래그 앤 드롭 (Drag & Drop) 지원
  - 로컬 이미지 파일 업로드
  - 이미지 URL 직접 입력 분석
- **🔍 6단계 정밀 AI 분석 파이프라인**
  1. 이미지 전처리
  2. 메타데이터 분석
  3. 텍스처 패턴 검사
  4. GAN 아티팩트 탐지
  5. 얼굴 특징점 분석
  6. 모델 지문 식별
- **📊 상세 결과 리포트 및 RAG 기능**
  - AI 생성 / 딥페이크 확률(Score) 제공
  - 딥페이크 확률이 높은 경우(70점 이상) **RAG(검색 증강 생성) 기반 심층 분석** 활성화
- **🔗 손쉬운 결과 공유**
  - 생성된 분석 리포트를 고유 링크로 생성하여 클립보드에 복사 및 타인과 공유 가능

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend (웹 UI 및 클라이언트)
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS (모던 UI, 글래스모피즘, 마이크로 인터랙션 적용)
- **Deployment:** Vercel

### Backend & AI (API 및 분석 로직)
- **Framework:** FastAPI (Python)
- **AI Integration:** OpenAI API
- **Database / Cache:** Upstash Redis
- **Image Processing:** Pillow (PIL), python-multipart
- **Deployment:** Vercel Serverless Functions (`api/` 디렉터리 구성)

---

## 📂 프로젝트 구조 (Project Structure)

Vercel의 Serverless 배포 기준에 맞춰, 프론트엔드 정적 파일이 루트에 위치하고 백엔드 API 로직은 `api/` 폴더에 위치하도록 모노레포 형태로 구성되어 있습니다.

```text
deepguard_react_web/
├── api/                   # Python FastAPI 백엔드 (Vercel Serverless)
│   ├── index.py           # FastAPI 엔트리포인트
│   └── requirements.txt   # 백엔드 의존성
├── src/                   # React 프론트엔드 소스코드
│   ├── screens/           # UI 화면 컴포넌트 (Home, Analyzing, Result 등)
│   ├── App.jsx            # 메인 애플리케이션 진입점 및 상태 관리
│   └── index.css          # 글로벌 스타일 및 디자인 시스템
├── public/                # 파비콘 및 정적 에셋
├── package.json           # 노드 패키지 정보
└── vercel.json            # Vercel 배포 및 라우팅 설정 파일
```

---

## 🚀 로컬 실행 방법 (How to run locally)

### 1. 환경 변수 설정
루트 디렉터리 및 `api/` 디렉터리에 `.env` 파일을 생성하고 필요한 설정값을 입력합니다. (OpenAI API Key 및 DB 정보 등)

### 2. Frontend 실행
```bash
npm install
npm run dev
```

### 3. Backend (API) 실행
```bash
cd api
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```

---

*본 프로젝트는 안전한 디지털 환경을 위한 미디어 진위 파악 기술 연구 및 구현을 목적으로 개발되었습니다.*
