import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../../lib/constants'
import { YEAR_OPTIONS, formatBirthDateLabel } from '../../lib/date'
import { focusField } from '../../lib/dom'

export default function SajuForm({
  form,
  isViewing,
  isGuest,
  user,
  profiles,
  profile,
  profileReady,
  selectedId,
  selectedName,
  result,
  loading,
  error,
  onLogin,
  onOpenCreate,
  onOpenEdit,
  onOpenOnboarding,
  onAnalyze,
  onNewReading,
  onDelete,
  leaveViewingIfEdited,
}) {
  const {
    name,
    setName,
    birthYear,
    setBirthYear,
    birthMonth,
    setBirthMonth,
    birthDay,
    setBirthDay,
    period,
    setPeriod,
    hour,
    setHour,
    minute,
    setMinute,
    gender,
    setGender,
    calendarType,
    setCalendarType,
    birthTimeText,
    monthOptions,
    dayOptions,
    birthDate,
    missing,
    onHourTypeahead,
    onMinuteTypeahead,
    onPeriodTypeahead,
    getFieldClass,
  } = form

  const birthDateLabel = formatBirthDateLabel(birthDate)

  return (
    <section
      className={isViewing ? 'panel is-viewing' : 'panel'}
      aria-label="사주 입력"
    >
      {isGuest && !isViewing && (
        <p className="profile-note">
          손님도 사주를 볼 수 있습니다. 결과의 절반만 먼저 보여 드리고,
          <button
            type="button"
            className="profile-note-link"
            onClick={onLogin}
          >
            Google 로그인
          </button>
          후 나머지를 열어 드립니다.
        </p>
      )}

      {user && profiles.length > 0 && !isViewing && (
        <p className="profile-note">
          지금 선택된 프로필은 <strong>{profile?.name}</strong>입니다.
          <button
            type="button"
            className="profile-note-link"
            onClick={onOpenCreate}
          >
            프로필을 추가
          </button>
          하거나
          <button
            type="button"
            className="profile-note-link"
            onClick={onOpenEdit}
          >
            프로필을 수정
          </button>
          할 수 있습니다.
        </p>
      )}

      {user && profiles.length === 0 && profileReady && !isViewing && (
        <p className="profile-note">
          아직 저장된 명식이 없습니다.
          <button
            type="button"
            className="profile-note-link"
            onClick={onOpenOnboarding}
          >
            프로필 추가
          </button>
          로 생시와 명식을 등록해 주세요.
        </p>
      )}

      {isViewing && (
        <p className="viewing-note">
          명부에서 <strong>{selectedName}</strong>님의 풀이를 열람 중입니다.
          <span className="viewing-note-hint">
            다시 풀어보면 이 기록이 수정되고, 삭제도 할 수 있습니다.
          </span>
        </p>
      )}

      <div className={getFieldClass(missing.name)}>
        <div className="field-head">
          <label htmlFor="name">이름</label>
          <span className="live">{name}</span>
        </div>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            const next = e.target.value
            setName(next)
            leaveViewingIfEdited({ name: next })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAnalyze()
          }}
          placeholder="이름을 입력하세요"
          autoComplete="name"
        />
      </div>

      <div className={getFieldClass(missing.birthDate)}>
        <div className="field-head">
          <span className="label-text" id="birthDateLabel">
            생년월일
          </span>
          <span className="live">{birthDateLabel}</span>
        </div>
        <div
          className="date-selects"
          role="group"
          aria-labelledby="birthDateLabel"
        >
          <select
            id="birthYear"
            aria-label="년"
            value={birthYear}
            onChange={(e) => {
              const next = e.target.value
              const nextBirth =
                next && birthMonth && birthDay
                  ? `${next}-${birthMonth}-${birthDay}`
                  : ''
              setBirthYear(next)
              leaveViewingIfEdited({ birthDate: nextBirth })
            }}
          >
            <option value="">년</option>
            {YEAR_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}년
              </option>
            ))}
          </select>

          <select
            id="birthMonth"
            aria-label="월"
            value={birthMonth}
            onChange={(e) => {
              const next = e.target.value
              const nextBirth =
                birthYear && next && birthDay
                  ? `${birthYear}-${next}-${birthDay}`
                  : ''
              setBirthMonth(next)
              leaveViewingIfEdited({ birthDate: nextBirth })
            }}
          >
            <option value="">월</option>
            {monthOptions.map((value) => (
              <option key={value} value={value}>
                {Number(value)}월
              </option>
            ))}
          </select>

          <select
            id="birthDay"
            aria-label="일"
            value={birthDay}
            onChange={(e) => {
              const next = e.target.value
              const nextBirth =
                birthYear && birthMonth && next
                  ? `${birthYear}-${birthMonth}-${next}`
                  : ''
              setBirthDay(next)
              leaveViewingIfEdited({ birthDate: nextBirth })
            }}
          >
            <option value="">일</option>
            {dayOptions.map((value) => (
              <option key={value} value={value}>
                {Number(value)}일
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <div className="field-head">
          <span className="label-text">태어난 시간</span>
          <span className="live">
            {birthTimeText === '--:--' ? '' : birthTimeText}
          </span>
        </div>
        <div className="time-selects">
          <select
            id="period"
            aria-label="오전 오후"
            value={period}
            onChange={(e) => {
              const next = e.target.value
              setPeriod(next)
              leaveViewingIfEdited({ period: next })
              if (next) focusField('hour')
            }}
            onKeyDown={onPeriodTypeahead}
          >
            <option value="">오전/오후</option>
            <option value="오전">오전</option>
            <option value="오후">오후</option>
          </select>

          <select
            id="hour"
            aria-label="시"
            value={hour}
            onChange={(e) => {
              const next = e.target.value
              setHour(next)
              leaveViewingIfEdited({ hour: next })
              if (next) focusField('minute')
            }}
            onKeyDown={onHourTypeahead}
          >
            <option value="">시</option>
            {HOUR_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}시
              </option>
            ))}
          </select>

          <select
            id="minute"
            aria-label="분"
            value={minute}
            onChange={(e) => {
              const next = e.target.value
              setMinute(next)
              leaveViewingIfEdited({ minute: next })
              if (next) focusField('gender')
            }}
            onKeyDown={onMinuteTypeahead}
          >
            <option value="">분</option>
            {MINUTE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {Number(value)}분
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-grid">
        <div className={getFieldClass(missing.gender)}>
          <div className="field-head">
            <label htmlFor="gender">성별</label>
            <span className="live">{gender}</span>
          </div>
          <select
            id="gender"
            value={gender}
            onChange={(e) => {
              const next = e.target.value
              setGender(next)
              leaveViewingIfEdited({ gender: next })
              if (next) focusField('calendarType')
            }}
          >
            <option value="">선택</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>

        <div className={getFieldClass(missing.calendarType)}>
          <div className="field-head">
            <label htmlFor="calendarType">양력/음력</label>
            <span className="live">{calendarType}</span>
          </div>
          <select
            id="calendarType"
            value={calendarType}
            onChange={(e) => {
              const next = e.target.value
              setCalendarType(next)
              leaveViewingIfEdited({ calendarType: next })
            }}
          >
            <option value="">선택</option>
            <option value="양력">양력</option>
            <option value="음력">음력</option>
          </select>
        </div>
      </div>

      <p className="saju-title">
        {name ? `${name}님의 사주` : '새 사주를 적어 주세요'}
      </p>

      <div className="cta-row">
        <button
          type="button"
          className="cta"
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading
            ? '천기를 읽는 중...'
            : selectedId
              ? '다시 풀어보기'
              : '내 사주 보기'}
        </button>

        {(selectedId || result) && user && (
          <button
            type="button"
            className="cta-new"
            onClick={onNewReading}
            disabled={loading || !profile}
          >
            새 사주 보기
          </button>
        )}
      </div>

      {selectedId && (
        <button
          type="button"
          className="cta-delete"
          onClick={onDelete}
          disabled={loading}
        >
          이 기록 삭제
        </button>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  )
}
