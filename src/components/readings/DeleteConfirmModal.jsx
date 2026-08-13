export default function DeleteConfirmModal({ target, busy, onCancel, onConfirm }) {
  if (!target) return null

  return (
    <div
      className="omen-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-omen-title"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="omen-warning omen-delete"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="delete-omen-title" className="omen-title">
          명부의 소각
        </p>
        <p className="omen-text">
          <strong>{target.name}</strong>의 사주가
          <br />
          명부에서 영원히 지워지리라.
          <br />
          한 번 태운 글은 되돌릴 수 없다.
          <br />
          참으로 소각할 것인가?
        </p>
        <div className="omen-actions">
          <button
            type="button"
            className="omen-keep"
            onClick={onCancel}
            disabled={busy}
          >
            아직 두지 않으리
          </button>
          <button
            type="button"
            className="omen-burn"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? '소각하는 중...' : '명부에서 태우리'}
          </button>
        </div>
      </div>
    </div>
  )
}
