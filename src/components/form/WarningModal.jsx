export default function WarningModal({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="omen-overlay"
      role="alertdialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="omen-warning"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="omen-title">신벌의 고지</p>
        <p className="omen-text">
          생시와 명식을 빠짐없이 아뢰어라.
          <br />
          공허한 글로 신을 부르면,
          <br />
          그 업보로 신벌을 받을 수도 있으리라.
        </p>
        <button type="button" className="omen-dismiss" onClick={onClose}>
          경고를 거두리라
        </button>
      </div>
    </div>
  )
}
