import { cleanReadingText } from './cleanReadingText'

// Vite: VITE_ 로 시작하는 환경변수만 프론트에서 사용 가능
const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-3.6-flash'

export async function generateSajuReading(prompt) {
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 없습니다. .env 파일을 확인하고 개발 서버를 다시 실행하세요.',
    )
  }

  // fetch만 사용 (axios / SDK 미사용)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      data?.error?.message || `Gemini API 오류 (${res.status})`,
    )
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    ?.trim()

  if (!text) {
    throw new Error('Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
  }

  return cleanReadingText(text)
}
