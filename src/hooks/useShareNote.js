import { useEffect, useState } from 'react'

export function useShareNote() {
  const [shareNote, setShareNote] = useState('')

  useEffect(() => {
    if (!shareNote) return undefined
    if (shareNote === '공유 창을 열었습니다.') return undefined
    const timer = window.setTimeout(() => setShareNote(''), 3200)
    return () => window.clearTimeout(timer)
  }, [shareNote])

  return [shareNote, setShareNote]
}
