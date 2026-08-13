import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatBirthTime } from './prompt'
import { supabase } from './supabase'
import './App.css'

function formatBirthDateLabel(value) {
  if (!value) return ''
  const [y, m, d] = String(value).split('-')
  if (!y || !m || !d) return value
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

function normalizeResultText(text) {
  return String(text || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim()
}

function resultParagraphs(text) {
  return normalizeResultText(text)
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n/g, ' ').trim())
    .filter(Boolean)
}

export default function ResultPage() {
  const { token } = useParams()
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareNote, setShareNote] = useState('')

  useEffect(() => {
    if (!shareNote) return undefined
    const timer = window.setTimeout(() => setShareNote(''), 3200)
    return () => window.clearTimeout(timer)
  }, [shareNote])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      setReading(null)

      if (!token) {
        setError('공유 링크가 올바르지 않습니다.')
        setLoading(false)
        return
      }

      const { data, error: rpcError } = await supabase.rpc('get_shared_reading', {
        p_token: token,
      })

      if (!mounted) return

      if (rpcError) {
        console.error(rpcError)
        setError(rpcError.message || '공유된 사주를 불러오지 못했습니다.')
        setLoading(false)
        return
      }

      if (!data) {
        setError('공개되지 않았거나 찾을 수 없는 사주입니다.')
        setLoading(false)
        return
      }

      setReading(data)
      setLoading(false)

      const title = `${data.name}님의 사주 | 백 선생의 사주`
      document.title = title
      const description = `${data.name}님의 사주 풀이 — 백 선생의 사주`
      const descTag = document.querySelector('meta[name="description"]')
      if (descTag) descTag.setAttribute('content', description)
    }

    load()
    return () => {
      mounted = false
    }
  }, [token])

  const birthTimeText = reading
    ? formatBirthTime({
        period: reading.period || '',
        hour: reading.hour || '',
        minute: reading.minute || '',
      })
    : '--:--'
  const birthDateLabel = formatBirthDateLabel(reading?.birth_date)

  async function handleShareAgain() {
    const url = window.location.href
    try {
      if (navigator.share) {
        setShareNote('공유 창을 열었습니다.')
        try {
          await navigator.share({
            title: reading ? `${reading.name}님의 사주` : '백 선생의 사주',
            text: '백 선생이 풀어 준 사주를 확인해 보세요.',
            url,
          })
        } catch (err) {
          if (err?.name !== 'AbortError') {
            throw err
          }
        }
        setShareNote('')
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('링크를 복사했습니다.')
    } catch {
      setShareNote('공유에 실패했습니다. 주소창의 링크를 복사해 주세요.')
    }
  }

  return (
    <div className="page page-result">
      <div className="atmosphere" aria-hidden="true" />

      <main className="shell result-shell">
        <header className="hero">
          <p className="eyebrow">공유된 천기 · 풀이</p>
          <h1 className="brand">백 선생의 사주</h1>
          <p className="lede">링크로 전해진 명식의 풀이입니다.</p>
        </header>

        {loading ? (
          <p className="result-status">명부를 펼치는 중...</p>
        ) : error ? (
          <section className="panel">
            <p className="error">{error}</p>
            <Link className="cta-new" to="/">
              처음으로 돌아가기
            </Link>
          </section>
        ) : (
          <section id="result-panel" className="result-panel" aria-live="polite">
            <p className="result-eyebrow">천기 · 풀이</p>
            <h2>{reading.name}님의 사주</h2>
            {(birthDateLabel || reading.gender || reading.calendar_type) && (
              <p className="result-meta">
                {[
                  birthDateLabel,
                  reading.gender,
                  reading.calendar_type,
                  birthTimeText !== '--:--' ? birthTimeText : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <div className="result-body">
              {resultParagraphs(reading.result).map((paragraph, index) => (
                <p key={`shared-${index}`}>{paragraph}</p>
              ))}
            </div>

            <div className="share-actions">
              <button
                type="button"
                className="cta-share"
                onClick={handleShareAgain}
              >
                친구에게 다시 공유
              </button>
              <Link className="cta-new" to="/">
                내 사주도 보러 가기
              </Link>
              {shareNote ? <p className="share-note">{shareNote}</p> : null}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
