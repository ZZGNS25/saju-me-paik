// useState: 화면에 보여줄 값을 "기억"하고, 바뀌면 화면을 다시 그려 주는 React 기능
import { useState } from 'react'
import './App.css'
import { buildSajuPrompt, formatBirthTime } from './prompt'
import { generateSajuReading } from './gemini'
import { splitReadingParagraphs } from './cleanReadingText'

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
)

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [period, setPeriod] = useState('') // 오전 | 오후 | ''
  const [hour, setHour] = useState('') // 1~12 | ''
  const [minute, setMinute] = useState('') // 00~59 | ''
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)

  const birthTimeText = formatBirthTime({ period, hour, minute })

  // 오늘 날짜 (YYYY-MM-DD) — date input max용
  const today = new Date().toISOString().slice(0, 10)

  // 연도는 네 자리까지만 허용 (브라우저 6자리 입력 버그 방지)
  function handleBirthDateChange(e) {
    const value = e.target.value
    if (!value) {
      setBirthDate('')
      return
    }

    const year = value.split('-')[0] || ''
    if (year.length > 4) {
      e.target.value = birthDate
      return
    }

    setBirthDate(value)
  }

  function isFormComplete() {
    // 시간은 선택 사항 — 이름·생년월일·성별·양력/음력만 필수
    return (
      name.trim() !== '' &&
      birthDate !== '' &&
      gender !== '' &&
      calendarType !== ''
    )
  }

  async function handleAnalyze() {
    setError('')
    setResult('')

    if (!isFormComplete()) {
      setWarning(true)
      return
    }

    setWarning(false)
    setLoading(true)

    try {
      const prompt = buildSajuPrompt({
        name,
        birthDate,
        period,
        hour,
        minute,
        gender,
        calendarType,
      })
      const text = await generateSajuReading(prompt)
      setResult(text)
    } catch (err) {
      let message = err.message || '사주 해석 중 오류가 발생했습니다.'
      try {
        const parsed = JSON.parse(message)
        message = parsed?.error?.message || message
      } catch {
        // JSON이 아니면 원래 메시지 사용
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      {loading && (
        <div className="reading-overlay" role="status" aria-live="polite">
          <div className="reading-panel">
            <img
              className="reading-gif"
              src="/sinnaerim.gif"
              alt="신내림 의식"
            />
            <p className="reading-text">천기를 읽는 중...</p>
          </div>
        </div>
      )}

      {warning && (
        <div className="omen-overlay" role="alertdialog" aria-modal="true">
          <div className="omen-warning">
            <p className="omen-title">신벌의 고지</p>
            <p className="omen-text">
              생시와 명식을 빠짐없이 아뢰어라.
              <br />
              공허한 글로 신을 부르면,
              <br />
              그 업보로 신벌을 받을 수도 있으리라.
            </p>
            <button
              type="button"
              className="omen-dismiss"
              onClick={() => setWarning(false)}
            >
              경고를 거두리라
            </button>
          </div>
        </div>
      )}

      <main className="shell">
        <header className="hero">
          <p className="eyebrow">전통 명식 · 운명 해석</p>
          <h1 className="brand">백 선생의 사주</h1>
          <p className="lede">
            생시와 명식을 바탕으로, 담담하고 또렷하게 풀이합니다.
          </p>
        </header>

        <section className="panel" aria-label="사주 입력">
          <div className="field">
            <div className="field-head">
              <label htmlFor="name">이름</label>
              <span className="live">{name}</span>
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="birthDate">생년월일</label>
              <span className="live">{birthDate}</span>
            </div>
            <div className="input-with-icon">
              <input
                id="birthDate"
                type="date"
                min="1900-01-01"
                max={today}
                value={birthDate}
                onChange={handleBirthDateChange}
                onInput={handleBirthDateChange}
              />
              <img
                className="field-icon"
                src="/icon-calendar.svg"
                alt=""
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <span className="label-text">태어난 시간</span>
              <span className="live">{birthTimeText}</span>
            </div>
            <div className="time-selects">
              <select
                id="period"
                aria-label="오전 오후"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="">--</option>
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>

              <select
                id="hour"
                aria-label="시"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              >
                <option value="">--</option>
                {HOUR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.padStart(2, '0')}
                  </option>
                ))}
              </select>

              <select
                id="minute"
                aria-label="분"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              >
                <option value="">--</option>
                {MINUTE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <div className="field-head">
                <label htmlFor="gender">성별</label>
                <span className="live">{gender || '--'}</span>
              </div>
              <div className={`select-wrap${gender ? '' : ' is-empty'}`}>
                {!gender && (
                  <span className="select-fake" aria-hidden="true">
                    --
                  </span>
                )}
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={gender ? undefined : 'select-empty'}
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="calendarType">양력/음력</label>
                <span className="live">{calendarType || '--'}</span>
              </div>
              <div className={`select-wrap${calendarType ? '' : ' is-empty'}`}>
                {!calendarType && (
                  <span className="select-fake" aria-hidden="true">
                    --
                  </span>
                )}
                <select
                  id="calendarType"
                  value={calendarType}
                  onChange={(e) => setCalendarType(e.target.value)}
                  className={calendarType ? undefined : 'select-empty'}
                >
                  <option value="양력">양력</option>
                  <option value="음력">음력</option>
                </select>
              </div>
            </div>
          </div>

          <p className="saju-title">
            {name ? `${name}님의 사주` : '님의 사주'}
          </p>

          <button
            type="button"
            className="cta"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? '천기를 읽는 중...' : '내 사주 보기'}
          </button>

          {error && <p className="error">{error}</p>}
        </section>

        {result && (
          <section className="result-panel" aria-live="polite">
            <div className="result-frame">
              <header className="result-header">
                <p className="result-kicker">명식 풀이</p>
                <div className="result-title-row">
                  <h2>해석</h2>
                </div>
              </header>

              <div className="result-body">
                {splitReadingParagraphs(result).map((paragraph, index) => (
                  <div key={index} className="result-block">
                    {index > 0 && (
                      <div className="result-divider" aria-hidden="true">
                        <span />
                      </div>
                    )}
                    <p className="result-para">{paragraph}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
