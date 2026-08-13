import { formatBirthDateLabel } from '../../lib/date'

export default function ReadingList({
  readings,
  selectedId,
  listLoading,
  listError,
  profile,
  onNewReading,
  onSelectReading,
  onDeleteReading,
  onRetry,
}) {
  return (
    <>
      <h2 className="sidebar-title">명부</h2>
      <p className="sidebar-lede">
        {listLoading
          ? '불러오는 중...'
          : readings.length > 0
            ? `저장된 사주 · ${readings.length}명`
            : '저장된 사주'}
      </p>
      {!listLoading && !listError && readings.length === 0 ? (
        <p className="sidebar-empty sidebar-empty-above">
          아직 기록된 이름이 없습니다.
        </p>
      ) : null}
      <button
        type="button"
        className="sidebar-new"
        onClick={onNewReading}
        disabled={!profile}
      >
        새 사주 보기
      </button>
      {listError ? (
        <div className="sidebar-empty-wrap">
          <p className="sidebar-empty">{listError}</p>
          <button type="button" className="sidebar-retry" onClick={onRetry}>
            다시 불러오기
          </button>
        </div>
      ) : listLoading ? (
        <p className="sidebar-empty">명부를 펼치는 중...</p>
      ) : readings.length > 0 ? (
        <ul className="sidebar-list">
          {readings.map((reading) => (
            <li key={reading.id} className="sidebar-item">
              <button
                type="button"
                className={
                  selectedId === reading.id
                    ? 'sidebar-name is-active'
                    : 'sidebar-name'
                }
                onClick={() => onSelectReading(reading)}
              >
                <span className="sidebar-name-text">{reading.name}</span>
                {reading.birth_date && (
                  <span className="sidebar-name-meta">
                    {formatBirthDateLabel(reading.birth_date)}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="sidebar-delete"
                aria-label={`${reading.name} 기록 삭제`}
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteReading(reading.id)
                }}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
