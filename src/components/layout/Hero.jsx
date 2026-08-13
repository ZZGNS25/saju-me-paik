export default function Hero({ profile, isGuest, readingCount }) {
  return (
    <header className="hero">
      <p className="eyebrow">전통 명식 · 운명 해석</p>
      <h1 className="brand">백 선생의 사주</h1>
      <p className="lede">
        {profile
          ? `${profile.name}님의 명식을 불러와 풀이합니다.`
          : isGuest
            ? '로그인 없이도 먼저 풀어볼 수 있습니다. 전체 천기는 로그인 후 열립니다.'
            : '생시와 명식을 바탕으로, 담담하고 또렷하게 풀이합니다.'}
      </p>
      {typeof readingCount === 'number' && readingCount > 0 ? (
        <p className="trust-count">
          이때까지 총{' '}
          <span>{readingCount.toLocaleString('ko-KR')}</span>
          개의 사주가 생성되었습니다
        </p>
      ) : null}
    </header>
  )
}
