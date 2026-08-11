// useState: 화면에 보여줄 값을 "기억"하고, 바뀌면 화면을 다시 그려 주는 React 기능
import { useState } from 'react'
import './App.css'
import { buildSajuPrompt, formatBirthTime } from './prompt'
import { generateSajuReading } from './gemini'

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [unknownHour, setUnknownHour] = useState(false)
  const [unknownMinute, setUnknownMinute] = useState(false)
  const [unknownPeriod, setUnknownPeriod] = useState(false)
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)

  const birthTimeText = formatBirthTime(birthTime, {
    unknownHour,
    unknownMinute,
    unknownPeriod,
  })

  function isFormComplete() {
    const hasName = name.trim() !== ''
    const hasBirthDate = birthDate !== ''
    const hasBirthTime =
      birthTime !== '' || (unknownHour && unknownMinute && unknownPeriod)
    const hasGender = gender !== ''
    const hasCalendar = calendarType !== ''
    return hasName && hasBirthDate && hasBirthTime && hasGender && hasCalendar
  }

  async function handleAnalyze() {
    setError('')
    setResult('')

    // 정보가 비어 있으면 API 호출 없이 경고만 표시
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
        birthTime,
        unknownHour,
        unknownMinute,
        unknownPeriod,
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

      {warning && (
        <div className="omen-overlay" role="alertdialog" aria-modal="true">
          <div className="omen-warning">
            <img className="blood blood-1" src="/blood-stain-1.png" alt="" aria-hidden="true" />
            <img className="blood blood-2" src="/blood-stain-2.png" alt="" aria-hidden="true" />
            <img className="blood blood-3" src="/blood-stain-1.png" alt="" aria-hidden="true" />
            <img className="blood blood-4" src="/blood-stain-3.png" alt="" aria-hidden="true" />
            <img className="blood blood-5" src="/blood-stain-2.png" alt="" aria-hidden="true" />
            <img className="blood blood-6" src="/blood-stain-3.png" alt="" aria-hidden="true" />
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
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
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
            <div className="input-with-icon">
              <input
                id="birthTime"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
              <img
                className="field-icon"
                src="/icon-time.svg"
                alt=""
                aria-hidden="true"
              />
            </div>
            <div className="unknown-row">
              <label className="chip">
                <input
                  type="checkbox"
                  checked={unknownHour}
                  onChange={(e) => setUnknownHour(e.target.checked)}
                />
                시 모름
              </label>
              <label className="chip">
                <input
                  type="checkbox"
                  checked={unknownMinute}
                  onChange={(e) => setUnknownMinute(e.target.checked)}
                />
                분 모름
              </label>
              <label className="chip">
                <input
                  type="checkbox"
                  checked={unknownPeriod}
                  onChange={(e) => setUnknownPeriod(e.target.checked)}
                />
                오전/오후 모름
              </label>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <div className="field-head">
                <label htmlFor="gender">성별</label>
                <span className="live">{gender}</span>
              </div>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="calendarType">양력/음력</label>
                <span className="live">{calendarType}</span>
              </div>
              <select
                id="calendarType"
                value={calendarType}
                onChange={(e) => setCalendarType(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="양력">양력</option>
                <option value="음력">음력</option>
              </select>
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
            {loading ? '풀이 중...' : '내 사주 보기'}
          </button>

          {error && <p className="error">{error}</p>}
        </section>

        {result && (
          <section className="result-panel" aria-live="polite">
            <h2>해석</h2>
            <pre className="result" style={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </pre>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
