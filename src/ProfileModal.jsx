import { useEffect, useMemo, useState } from 'react'

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
)
const TODAY = new Date()
const CURRENT_YEAR = TODAY.getFullYear()
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => String(CURRENT_YEAR - i),
)
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
)

function daysInMonth(year, month) {
  if (!year || !month) return 31
  return new Date(Number(year), Number(month), 0).getDate()
}

function splitBirthDate(value) {
  if (!value) return { year: '', month: '', day: '' }
  const [year = '', month = '', day = ''] = String(value).split('-')
  return { year, month, day }
}

function formatBirthDateLabel(value) {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

function emptyForm() {
  return {
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    period: '',
    hour: '',
    minute: '',
    gender: '',
    calendarType: '',
  }
}

function formFromProfile(profile) {
  if (!profile) return emptyForm()
  const { year, month, day } = splitBirthDate(profile.birth_date)
  return {
    name: profile.name || '',
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    period: profile.period || '',
    hour: profile.hour || '',
    minute: profile.minute || '',
    gender: profile.gender || '',
    calendarType: profile.calendar_type || '',
  }
}

export function profileToFormValues(profile) {
  if (!profile) return null
  const { year, month, day } = splitBirthDate(profile.birth_date)
  return {
    name: profile.name || '',
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    period: profile.period || '',
    hour: profile.hour || '',
    minute: profile.minute || '',
    gender: profile.gender || '',
    calendarType: profile.calendar_type || '',
  }
}

export default function ProfileModal({
  mode = 'onboarding',
  open,
  initialProfile = null,
  busy = false,
  error = '',
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(emptyForm)
  const [showMissing, setShowMissing] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(formFromProfile(initialProfile))
    setShowMissing(false)
  }, [open, initialProfile])

  const maxMonth =
    form.birthYear === String(CURRENT_YEAR)
      ? String(TODAY.getMonth() + 1).padStart(2, '0')
      : '12'
  const monthOptions = MONTH_OPTIONS.filter((month) => month <= maxMonth)
  const maxDay =
    form.birthYear === String(CURRENT_YEAR) &&
    form.birthMonth === String(TODAY.getMonth() + 1).padStart(2, '0')
      ? TODAY.getDate()
      : daysInMonth(form.birthYear, form.birthMonth)
  const dayOptions = Array.from({ length: maxDay }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  )

  const birthDate =
    form.birthYear && form.birthMonth && form.birthDay
      ? `${form.birthYear}-${form.birthMonth}-${form.birthDay}`
      : ''

  const missing = useMemo(
    () => ({
      name: form.name.trim() === '',
      birthDate: birthDate === '',
      gender: form.gender === '',
      calendarType: form.calendarType === '',
    }),
    [form.name, birthDate, form.gender, form.calendarType],
  )

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function fieldClass(isIncomplete) {
    return showMissing && isIncomplete ? 'field is-missing' : 'field'
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (
      missing.name ||
      missing.birthDate ||
      missing.gender ||
      missing.calendarType
    ) {
      setShowMissing(true)
      return
    }

    onSave({
      name: form.name.trim(),
      birth_date: birthDate,
      period: form.period || null,
      hour: form.hour || null,
      minute: form.minute || null,
      gender: form.gender,
      calendar_type: form.calendarType,
    })
  }

  if (!open) return null

  const isOnboarding = mode === 'onboarding'
  const isCreate = mode === 'create' || isOnboarding
  const title = isOnboarding
    ? '프로필 추가'
    : mode === 'create'
      ? '프로필 추가'
      : '프로필 수정'
  const lede = isOnboarding
    ? '처음 오신 손님의 생시와 명식을 아뢰어 주십시오. 이후 사주에 바로 쓰입니다.'
    : mode === 'create'
      ? '다른 사람의 명식을 추가로 등록할 수 있습니다. 등록 후 목록에서 고르세요.'
      : '저장된 명식을 고치면, 새 사주 만들기에 반영됩니다.'

  return (
    <div
      className="profile-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={onClose}
    >
      <div
        className="profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="profile-modal-eyebrow">
          {isOnboarding
            ? '첫 방문 · 명식 등록'
            : mode === 'create'
              ? '추가 명식'
              : '내 명식'}
        </p>
        <h2 id="profile-modal-title" className="profile-modal-title">
          {title}
        </h2>
        <p className="profile-modal-lede">{lede}</p>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className={fieldClass(missing.name)}>
            <div className="field-head">
              <label htmlFor="profile-name">이름</label>
              <span className="live">{form.name}</span>
            </div>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="이름을 입력하세요"
              autoComplete="name"
              disabled={busy}
            />
          </div>

          <div className={fieldClass(missing.birthDate)}>
            <div className="field-head">
              <span className="label-text" id="profile-birth-label">
                생년월일
              </span>
              <span className="live">{formatBirthDateLabel(birthDate)}</span>
            </div>
            <div
              className="date-selects"
              role="group"
              aria-labelledby="profile-birth-label"
            >
              <select
                id="profile-birthYear"
                aria-label="년"
                value={form.birthYear}
                onChange={(e) => update('birthYear', e.target.value)}
                disabled={busy}
              >
                <option value="">년</option>
                {YEAR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}년
                  </option>
                ))}
              </select>
              <select
                id="profile-birthMonth"
                aria-label="월"
                value={form.birthMonth}
                onChange={(e) => update('birthMonth', e.target.value)}
                disabled={busy}
              >
                <option value="">월</option>
                {monthOptions.map((value) => (
                  <option key={value} value={value}>
                    {Number(value)}월
                  </option>
                ))}
              </select>
              <select
                id="profile-birthDay"
                aria-label="일"
                value={form.birthDay}
                onChange={(e) => update('birthDay', e.target.value)}
                disabled={busy}
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
              <span className="live muted-hint">선택</span>
            </div>
            <div className="time-selects">
              <select
                aria-label="오전 오후"
                value={form.period}
                onChange={(e) => update('period', e.target.value)}
                disabled={busy}
              >
                <option value="">오전/오후</option>
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <select
                aria-label="시"
                value={form.hour}
                onChange={(e) => update('hour', e.target.value)}
                disabled={busy}
              >
                <option value="">시</option>
                {HOUR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}시
                  </option>
                ))}
              </select>
              <select
                aria-label="분"
                value={form.minute}
                onChange={(e) => update('minute', e.target.value)}
                disabled={busy}
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
            <div className={fieldClass(missing.gender)}>
              <div className="field-head">
                <label htmlFor="profile-gender">성별</label>
              </div>
              <select
                id="profile-gender"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                disabled={busy}
              >
                <option value="">선택</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
            <div className={fieldClass(missing.calendarType)}>
              <div className="field-head">
                <label htmlFor="profile-calendar">양력/음력</label>
              </div>
              <select
                id="profile-calendar"
                value={form.calendarType}
                onChange={(e) => update('calendarType', e.target.value)}
                disabled={busy}
              >
                <option value="">선택</option>
                <option value="양력">양력</option>
                <option value="음력">음력</option>
              </select>
            </div>
          </div>

          {error ? <p className="profile-modal-error">{error}</p> : null}

          <div className="profile-modal-actions">
            {onClose && (
              <button
                type="button"
                className="profile-modal-cancel"
                onClick={onClose}
                disabled={busy}
              >
                닫기
              </button>
            )}
            <button
              type="submit"
              className="profile-modal-submit"
              disabled={busy}
            >
              {busy
                ? '저장 중...'
                : isCreate
                  ? '프로필 추가하기'
                  : '프로필 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
