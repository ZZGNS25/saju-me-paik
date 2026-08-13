export default function ReadingOverlay() {
  return (
    <div className="reading-overlay" role="status" aria-live="polite">
      <div className="reading-panel">
        <img
          className="reading-gif"
          src="/sinnaerim.gif"
          alt="신내림 의식"
        />
        <p className="reading-text">천기를 읽는 중...</p>
        <p className="reading-subtext">잠시만 기다려 주세요</p>
      </div>
    </div>
  )
}
