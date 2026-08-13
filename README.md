# 백 선생의 사주

생시와 명식을 바탕으로 사주·팔자를 풀이하는 웹 서비스입니다.  
전통 무속·고서 분위기의 UI에서 이름, 생년월일, 태어난 시간, 성별, 양력/음력을 입력하면 Gemini로 사주 해석을 받아볼 수 있습니다.

배포 주소: [https://saju-me-paik.vercel.app](https://saju-me-paik.vercel.app)

## 주요 기능

- 입장 게이트와 누적 사주 생성 수 표시
- 손님도 먼저 풀이 가능, 전체 결과는 Google 로그인 후 열람
- 명식 프로필 등록·수정·전환
- 사주 입력 폼 (이름, 생년월일, 시간, 성별, 양력/음력)
- 태어난 시간은 선택 사항
- **내 사주 보기**로 Gemini 해석 요청, 로그인 사용자는 명부에 저장
- 저장된 사주 열람·수정·삭제, 공유 링크(`/result/:token`)
- Google Analytics(GA4) 페이지뷰 수집

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해 프로젝트 루트에 `.env` 파일을 만듭니다.

```env
VITE_GEMINI_API_KEY=여기에_발급받은_API_키를_넣으세요
VITE_SUPABASE_URL=https://여기에_프로젝트_ref.supabase.co
VITE_SUPABASE_ANON_KEY=여기에_anon_public_JWT_키를_넣으세요
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

| 변수 | 설명 |
|------|------|
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey)에서 발급 |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` `public` 키 |
| `VITE_GA_MEASUREMENT_ID` | GA4 측정 ID (`G-`로 시작). 없으면 분석 태그를 넣지 않음 |

`.env`는 Git에 포함되지 않습니다. 배포 시에는 Vercel Environment Variables에 같은 값을 넣습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다. `.env`를 바꾼 뒤에는 개발 서버를 다시 시작하세요.

## 사용 방법

1. 입장 화면에서 **들어가기**를 누릅니다.
2. 이름, 생년월일, 성별, 양력/음력을 입력합니다. 태어난 시간은 비워도 됩니다.
3. **내 사주 보기**를 누릅니다.
4. 손님은 미리보기만 보고, Google 로그인 후 전체 풀이와 명부 저장을 이용합니다.
5. 저장된 사주는 사이드바 명부에서 다시 열거나, **친구에게 공유하기**로 링크를 보낼 수 있습니다.

## 폴더 구조

```
src/
  App.jsx                 홈 화면 조립
  main.jsx                라우팅, GA 연결
  pages/ResultPage.jsx    공유된 사주 페이지
  components/
    welcome/              입장 게이트
    layout/               배경, 헤더, Analytics
    auth/                 로그인·계정
    profile/              프로필 모달
    form/                 사주 입력, 미입력 경고
    result/               풀이 결과, 해석 중 오버레이
    readings/             명부 사이드바, 삭제 확인
  hooks/                  인증, 폼, 프로필, 명부, 앱 상태
  lib/                    Gemini, Supabase, 날짜, 공유, GA
  styles/app.css          화면 스타일
  index.css               전역 토큰
```

`App.jsx`는 화면을 조립하고, 상태와 API 호출은 `hooks/`와 `lib/`에 둡니다.

## 기술 스택

- React 19 + Vite 8
- React Router
- Gemini API (`fetch` 호출)
- Supabase (Auth, Postgres)
- Google Analytics 4
- Vercel 배포

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint 검사 |
