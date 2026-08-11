# 백 선생의 사주

생시와 명식을 바탕으로 사주·팔자를 풀이하는 웹 서비스입니다.  
전통 무속·고서 분위기의 UI에서 이름, 생년월일, 태어난 시간, 성별, 양력/음력을 입력하면 Gemini로 사주 해석을 받아볼 수 있습니다.

## 주요 기능

- 사주 입력 폼 (이름, 생년월일, 시간, 성별, 양력/음력)
- 시·분·오전/오후 각각 **모름** 선택 가능
- **내 사주 보기** 버튼으로 Gemini 사주 해석 요청
- 입력이 비어 있으면 해석 없이 경고 표시
- `.env`의 API 키는 Git에 포함되지 않음

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해 프로젝트 루트에 `.env` 파일을 만듭니다.

```env
VITE_GEMINI_API_KEY=여기에_발급받은_API_키를_넣으세요
```

API 키는 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

## 사용 방법

1. 이름, 생년월일, 태어난 시간(또는 모름), 성별, 양력/음력을 입력합니다.
2. **내 사주 보기**를 누릅니다.
3. 화면에 사주 해석 결과가 표시됩니다.

## 기술 스택

- React + Vite
- Gemini API (`fetch` 호출)
- 환경 변수: `VITE_GEMINI_API_KEY`

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint 검사 |
