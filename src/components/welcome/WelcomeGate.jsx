export default function WelcomeGate({ authReady, readingCount, onEnter }) {
  return (
    <div className="page page-gate">
      <div className="atmosphere" aria-hidden="true" />
      <div className="gate-veil" aria-hidden="true" />

      <main className="gate" aria-label="입장">
        <p className="gate-eyebrow">전통 명식 · 운명 해석</p>
        <h1 className="gate-brand">백 선생의 사주</h1>
        <p className="gate-lede">
          생시와 명식을 아뢰면, 담담하고 또렷하게 천기를 풀어 드립니다.
        </p>

        {!authReady ? (
          <p className="gate-status" role="status">
            문 앞에서 신명을 확인하는 중...
          </p>
        ) : (
          <>
            <button type="button" className="gate-cta" onClick={onEnter}>
              들어가기
            </button>
            {typeof readingCount === 'number' && readingCount > 0 ? (
              <p className="gate-trust">
                이때까지 총{' '}
                <span>{readingCount.toLocaleString('ko-KR')}</span>
                개의 사주가 생성되었습니다
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
