export default function ResultPanel({
  locked = false,
  eyebrow,
  title,
  metaItems = [],
  visibleParagraphs = [],
  hiddenParagraphs = [],
  paragraphKey = 'result',
  onLogin,
  authBusy = false,
  onShare,
  shareBusy = false,
  shareNote = '',
  shareLabel,
  children,
}) {
  const meta = metaItems.filter(Boolean).join(' · ')

  return (
    <section
      id="result-panel"
      className={locked ? 'result-panel is-locked' : 'result-panel'}
      aria-live="polite"
    >
      <p className="result-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {meta ? <p className="result-meta">{meta}</p> : null}

      <div className="result-body">
        {visibleParagraphs.map((paragraph, index) => (
          <p key={`${paragraphKey}-visible-${index}`}>{paragraph}</p>
        ))}
      </div>

      {locked && (
        <div className="result-lock">
          <div className="result-lock-preview" aria-hidden="true">
            {(hiddenParagraphs.length
              ? hiddenParagraphs.slice(0, 2)
              : ['봉인된 문장이 이곳에 이어진다.']
            ).map((paragraph, index) => (
              <p key={`hidden-${index}`}>{paragraph}</p>
            ))}
          </div>
          <div className="result-lock-veil">
            <p className="result-lock-title">나머지 천기는 봉인되어 있다</p>
            <p className="result-lock-text">
              Google로 들어가면 전체 풀이를 열고
              <br />
              명부에 남길 수 있습니다.
            </p>
            <button
              type="button"
              className="gate-cta result-lock-cta"
              onClick={onLogin}
              disabled={authBusy}
            >
              {authBusy ? '문을 여는 중...' : '로그인하고 전체 보기'}
            </button>
          </div>
        </div>
      )}

      {(onShare || children) && !locked ? (
        <div className="share-actions">
          {onShare ? (
            <button
              type="button"
              className="cta-share"
              onClick={onShare}
              disabled={shareBusy}
            >
              {shareBusy ? '링크 준비 중...' : shareLabel || '친구에게 공유하기'}
            </button>
          ) : null}
          {children}
          {shareNote ? <p className="share-note">{shareNote}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
