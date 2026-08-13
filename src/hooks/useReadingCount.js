import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReadingCount() {
  const [readingCount, setReadingCount] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadReadingCount() {
      const { data, error: countError } = await supabase.rpc(
        'get_saju_reading_count',
      )
      if (cancelled) return
      if (countError) {
        setReadingCount(null)
        return
      }
      const next = Number(data)
      setReadingCount(Number.isFinite(next) ? next : null)
    }

    loadReadingCount()
    return () => {
      cancelled = true
    }
  }, [])

  return [readingCount, setReadingCount]
}
