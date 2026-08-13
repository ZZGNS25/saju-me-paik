import { useEffect, useRef, useState } from 'react'
import { READING_FIELDS } from '../lib/constants'
import { formatBirthDateLabel } from '../lib/date'
import { scrollToResult } from '../lib/dom'
import {
  clearPendingReading,
  readPendingReading,
  savePendingReading,
} from '../lib/pendingReading'
import { buildSajuPrompt } from '../lib/prompt'
import { generateSajuReading } from '../lib/gemini'
import { getLockedResultParts, normalizeResultText, resultParagraphs } from '../lib/resultText'
import { shareOrCopyLink } from '../lib/share'
import { supabase, formatSupabaseError } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProfiles } from './useProfiles'
import { useReadingCount } from './useReadingCount'
import { useReadings } from './useReadings'
import { useSajuForm } from './useSajuForm'
import { useShareNote } from './useShareNote'

export function useSajuApp() {
  const form = useSajuForm()
  const {
    user,
    authReady,
    authBusy,
    authError,
    setAuthError,
    onAuthEventRef,
    handleGoogleLogin: startGoogleLogin,
    handleLogout: startLogout,
  } = useAuth()

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedName, setSelectedName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const loadedSnapshotRef = useRef('')
  const pendingRestoreRef = useRef(false)
  const restoreRef = useRef({})

  const [shareNote, setShareNote] = useShareNote()
  const [readingCount, setReadingCount] = useReadingCount()
  const { readings, setReadings, listError, listLoading, loadReadings, persistReading } =
    useReadings({ user, authReady })

  const applyProfileToForm = (nextProfile) => {
    form.applyProfileToForm(nextProfile)
  }

  const profilesApi = useProfiles({
    user,
    authReady,
    selectedId,
    applyProfileToForm,
  })

  const {
    profile,
    profiles,
    profileReady,
    showOnboarding,
    setShowOnboarding,
    showProfileCreate,
    setShowProfileCreate,
    showProfileEdit,
    setShowProfileEdit,
    profileBusy,
    profileError,
    setProfileError,
    handleSelectProfile: selectProfile,
    handleSaveProfile: saveProfile,
    resetProfiles,
  } = profilesApi

  onAuthEventRef.current = (event) => {
    if (event === 'SIGNED_OUT') {
      setHasEntered(false)
      resetProfiles()
    }
  }

  function leaveViewingIfEdited() {
    // 열람 중 수정해도 같은 기록을 갱신(Update)할 수 있도록 선택 상태를 유지합니다.
  }

  function handleSelectProfile(profileId) {
    selectProfile(profileId)
    if (!selectedId) loadedSnapshotRef.current = ''
  }

  async function handleSaveProfile(payload) {
    const data = await saveProfile(payload)
    if (data && !selectedId) loadedSnapshotRef.current = ''
  }

  async function handleGoogleLogin() {
    if (result) {
      savePendingReading({
        ...form.currentValues(),
        result,
      })
    }
    await startGoogleLogin()
  }

  async function handleLogout() {
    const ok = await startLogout()
    if (!ok) return
    form.clearFormFields()
    setResult('')
    setSelectedId(null)
    setSelectedName('')
    setReadings([])
    setHasEntered(false)
  }

  useEffect(() => {
    if (!warning && !deleteTarget) return undefined

    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (deleteTarget && !deleteBusy) setDeleteTarget(null)
      else if (warning) setWarning(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [warning, deleteTarget, deleteBusy])

  useEffect(() => {
    if (!loading) return undefined
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [loading])

  function handleSelectReading(reading) {
    if (selectedId === reading.id) {
      handleNewReading()
      return
    }
    setShareNote('')

    const nextName = reading.name || ''
    const nextBirth = reading.birth_date || ''
    const nextPeriod = reading.period || ''
    const nextHour = reading.hour || ''
    const nextMinute = reading.minute || ''
    const nextGender = reading.gender || ''
    const nextCalendar = reading.calendar_type || ''

    setSelectedId(reading.id)
    setSelectedName(nextName)
    form.setName(nextName)
    form.applyBirthDate(nextBirth)
    form.setPeriod(nextPeriod)
    form.setHour(nextHour)
    form.setMinute(nextMinute)
    form.setGender(nextGender)
    form.setCalendarType(nextCalendar)
    setResult(normalizeResultText(reading.result))
    setError('')
    form.setShowMissing(false)
    setWarning(false)
    loadedSnapshotRef.current = form.snapshotOf({
      name: nextName,
      birthDate: nextBirth,
      period: nextPeriod,
      hour: nextHour,
      minute: nextMinute,
      gender: nextGender,
      calendarType: nextCalendar,
    })
    scrollToResult()
  }

  function handleNewReading() {
    if (profile) applyProfileToForm(profile)
    else form.clearFormFields()
    setResult('')
    setSelectedId(null)
    setSelectedName('')
    setError('')
    setShareNote('')
    setWarning(false)
    form.setShowMissing(false)
    loadedSnapshotRef.current = ''
    clearPendingReading()

    requestAnimationFrame(() => {
      document.getElementById('name')?.focus()
      document.querySelector('.panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  async function handleAnalyze() {
    setError('')
    setAuthError('')

    if (!form.isFormComplete()) {
      form.setShowMissing(true)
      setWarning(true)
      form.focusFirstMissing()
      return
    }

    if (user && !profile) {
      setShowOnboarding(true)
      setProfileError('저장하려면 먼저 명식 프로필을 등록해 주세요.')
    }

    const editingId = user && profile ? selectedId : null
    setResult('')
    form.setShowMissing(false)
    setWarning(false)
    setLoading(true)

    const values = form.currentValues()

    try {
      const prompt = buildSajuPrompt(values)
      const text = normalizeResultText(await generateSajuReading(prompt))
      setResult(text)
      setSelectedName(form.name.trim())

      if (!user || !profile) {
        savePendingReading({ ...values, result: text })
        setSelectedId(null)
        scrollToResult()
        return
      }

      const data = await persistReading({
        text,
        editingId,
        values,
        nextUser: user,
        nextProfile: profile,
      })
      clearPendingReading()
      setSelectedId(data.id)
      if (editingId) {
        setReadings((prev) =>
          prev.map((reading) => (reading.id === data.id ? data : reading)),
        )
      } else {
        setReadings((prev) => [data, ...prev])
        setReadingCount((prev) =>
          typeof prev === 'number' ? prev + 1 : prev,
        )
      }
      loadedSnapshotRef.current = form.currentSnapshot()
      scrollToResult()
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

  function requestDeleteReading(readingId) {
    if (!readingId || deleteBusy) return
    const reading = readings.find((item) => item.id === readingId)
    const targetName =
      reading?.name ||
      (selectedId === readingId ? selectedName : '') ||
      '이 사주'
    setDeleteTarget({ id: readingId, name: targetName })
  }

  async function confirmDeleteReading() {
    if (!deleteTarget?.id || deleteBusy) return

    const readingId = deleteTarget.id
    setDeleteBusy(true)
    setError('')

    const { error: deleteError } = await supabase
      .from('saju_readings')
      .delete()
      .eq('id', readingId)

    if (deleteError) {
      setError(deleteError.message || '사주 기록 삭제에 실패했습니다.')
      setDeleteBusy(false)
      setDeleteTarget(null)
      return
    }

    setReadings((prev) => prev.filter((reading) => reading.id !== readingId))
    setDeleteBusy(false)
    setDeleteTarget(null)
    if (selectedId === readingId) {
      handleNewReading()
    }
  }

  async function handleShareReading() {
    if (!selectedId || shareBusy) return

    setShareBusy(true)
    setShareNote('')
    setError('')

    const current = readings.find((item) => item.id === selectedId)
    let shareToken = current?.share_token

    if (!current?.is_shared || !shareToken) {
      const { data, error: shareError } = await supabase
        .from('saju_readings')
        .update({ is_shared: true })
        .eq('id', selectedId)
        .select(READING_FIELDS)
        .single()

      if (shareError) {
        console.error(shareError)
        setError(
          formatSupabaseError(shareError, '공유 링크를 만들지 못했습니다.'),
        )
        setShareBusy(false)
        return
      }

      shareToken = data.share_token
      setReadings((prev) =>
        prev.map((reading) => (reading.id === data.id ? data : reading)),
      )
    }

    const shareUrl = `${window.location.origin}/result/${shareToken}`
    const title = `${selectedName || form.name || '사주'}님의 사주`
    const text = '백 선생이 풀어 준 사주를 확인해 보세요.'

    if (navigator.share) setShareNote('공유 창을 열었습니다.')
    const outcome = await shareOrCopyLink({ title, text, url: shareUrl })
    if (outcome.status === 'shared' || outcome.status === 'aborted') {
      setShareNote('')
    } else if (outcome.status === 'copied') {
      setShareNote('공유 링크를 복사했습니다.')
    } else {
      setShareNote(`이 링크를 복사해 공유하세요: ${outcome.url}`)
    }
    setShareBusy(false)
  }

  restoreRef.current = {
    form,
    persistReading,
    profile,
    user,
    setShowOnboarding,
    setProfileError,
    setReadings,
    setReadingCount,
  }

  useEffect(() => {
    if (!authReady || !user || !profileReady) return
    if (pendingRestoreRef.current) return

    const pending = readPendingReading()
    if (!pending?.result) return

    pendingRestoreRef.current = true

    const {
      form: currentForm,
      persistReading: persist,
      profile: currentProfile,
      user: currentUser,
      setShowOnboarding: openOnboarding,
      setProfileError: setRestoreProfileError,
      setReadings: setRestoreReadings,
      setReadingCount: setRestoreCount,
    } = restoreRef.current

    currentForm.setName(pending.name || '')
    currentForm.applyBirthDate(pending.birthDate || '')
    currentForm.setPeriod(pending.period || '')
    currentForm.setHour(pending.hour || '')
    currentForm.setMinute(pending.minute || '')
    currentForm.setGender(pending.gender || '')
    currentForm.setCalendarType(pending.calendarType || '')
    setResult(normalizeResultText(pending.result))
    setSelectedName((pending.name || '').trim())
    setSelectedId(null)
    scrollToResult()

    if (!currentProfile) {
      openOnboarding(true)
      setRestoreProfileError('전체 천기를 보관하려면 명식을 등록해 주세요.')
      pendingRestoreRef.current = false
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await persist({
          text: normalizeResultText(pending.result),
          values: {
            name: pending.name || '',
            birthDate: pending.birthDate || '',
            period: pending.period || '',
            hour: pending.hour || '',
            minute: pending.minute || '',
            gender: pending.gender || '',
            calendarType: pending.calendarType || '',
          },
          nextUser: currentUser,
          nextProfile: currentProfile,
        })
        if (cancelled) return
        clearPendingReading()
        setSelectedId(data.id)
        setRestoreReadings((prev) => {
          if (prev.some((item) => item.id === data.id)) return prev
          return [data, ...prev]
        })
        setRestoreCount((prev) =>
          typeof prev === 'number' ? prev + 1 : prev,
        )
        loadedSnapshotRef.current = currentForm.snapshotOf({
          name: pending.name || '',
          birthDate: pending.birthDate || '',
          period: pending.period || '',
          hour: pending.hour || '',
          minute: pending.minute || '',
          gender: pending.gender || '',
          calendarType: pending.calendarType || '',
        })
      } catch (err) {
        if (!cancelled) {
          pendingRestoreRef.current = false
          setError(err.message || '로그인 후 결과 저장에 실패했습니다.')
        }
      }
    })()

    return () => {
      cancelled = true
      if (readPendingReading()?.result) {
        pendingRestoreRef.current = false
      }
    }
  }, [authReady, user, profileReady, profile?.id])

  const isGuest = !user
  const isViewing = Boolean(selectedId && result)
  const isResultLocked = Boolean(result && isGuest)
  const lockedParts = isResultLocked
    ? getLockedResultParts(result)
    : { visible: resultParagraphs(result), hidden: [] }
  const showWelcomeGate = !hasEntered
  const birthDateLabel = formatBirthDateLabel(form.birthDate)

  function handleEnterApp() {
    setHasEntered(true)
  }

  function openProfileCreate() {
    setProfileError('')
    if (profiles.length === 0) setShowOnboarding(true)
    else setShowProfileCreate(true)
  }

  function openProfileEdit() {
    setProfileError('')
    setShowProfileEdit(true)
  }

  function openOnboarding() {
    setProfileError('')
    setShowOnboarding(true)
  }

  return {
    form,
    leaveViewingIfEdited,
    user,
    authReady,
    authBusy,
    authError,
    result,
    loading,
    error,
    warning,
    setWarning,
    selectedId,
    selectedName,
    deleteTarget,
    setDeleteTarget,
    deleteBusy,
    shareBusy,
    shareNote,
    readingCount,
    hasEntered,
    readings,
    listError,
    listLoading,
    loadReadings,
    profile,
    profiles,
    profileReady,
    showOnboarding,
    setShowOnboarding,
    showProfileCreate,
    setShowProfileCreate,
    showProfileEdit,
    setShowProfileEdit,
    profileBusy,
    profileError,
    setProfileError,
    isGuest,
    isViewing,
    isResultLocked,
    lockedParts,
    showWelcomeGate,
    birthDateLabel,
    handleEnterApp,
    handleGoogleLogin,
    handleLogout,
    handleSaveProfile,
    handleSelectProfile,
    handleSelectReading,
    handleNewReading,
    handleAnalyze,
    requestDeleteReading,
    confirmDeleteReading,
    handleShareReading,
    openProfileCreate,
    openProfileEdit,
    openOnboarding,
  }
}
