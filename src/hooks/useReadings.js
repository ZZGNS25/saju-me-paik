import { useCallback, useEffect, useState } from 'react'
import { READING_FIELDS } from '../lib/constants'
import { supabase } from '../lib/supabase'

export function useReadings({ user, authReady }) {
  const [readings, setReadings] = useState([])
  const [listError, setListError] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const userId = user?.id

  const loadReadings = useCallback(async () => {
    if (!userId) {
      setReadings([])
      setListLoading(false)
      setListError('')
      return
    }

    setListLoading(true)
    setListError('')
    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select(READING_FIELDS)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      setListError(fetchError.message || '명부를 불러오지 못했습니다.')
      setListLoading(false)
      return
    }

    setReadings(data ?? [])
    setListLoading(false)
  }, [userId])

  const persistReading = useCallback(async ({
    text,
    editingId = null,
    values,
    nextUser = user,
    nextProfile,
  }) => {
    if (!nextUser) return null

    const payload = {
      name: values.name.trim(),
      birth_date: values.birthDate,
      period: values.period || null,
      hour: values.hour || null,
      minute: values.minute || null,
      gender: values.gender,
      calendar_type: values.calendarType,
      result: text,
      user_id: nextUser.id,
      profile_id: nextProfile?.id || null,
    }

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('saju_readings')
        .update(payload)
        .eq('id', editingId)
        .select(READING_FIELDS)
        .single()
      if (updateError) {
        throw new Error(updateError.message || '사주 결과 수정에 실패했습니다.')
      }
      return data
    }

    const { data, error: saveError } = await supabase
      .from('saju_readings')
      .insert(payload)
      .select(READING_FIELDS)
      .single()
    if (saveError) {
      throw new Error(saveError.message || '사주 결과 저장에 실패했습니다.')
    }
    return data
  }, [user])

  useEffect(() => {
    if (!authReady) return
    loadReadings()
  }, [authReady, loadReadings])

  return {
    readings,
    setReadings,
    listError,
    listLoading,
    loadReadings,
    persistReading,
  }
}
