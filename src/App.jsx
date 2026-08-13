// useState: 화면에 보여줄 값을 "기억"하고, 바뀌면 화면을 다시 그려 주는 React 기능
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { buildSajuPrompt, formatBirthTime } from './prompt'
import { generateSajuReading } from './gemini'
import { supabase, formatSupabaseError } from './supabase'
import ProfileModal, { profileToFormValues } from './ProfileModal'

const PROFILE_FIELDS =
  'id, owner_id, name, birth_date, period, hour, minute, gender, calendar_type, created_at, updated_at'
const SELECTED_PROFILE_KEY = 'saju-me-selected-profile'
const PENDING_READING_KEY = 'saju-me-pending-reading'

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

const READING_FIELDS =
  'id, name, birth_date, period, hour, minute, gender, calendar_type, result, created_at, profile_id, share_token, is_shared'

function daysInMonth(year, month) {
  if (!year || !month) return 31
  return new Date(Number(year), Number(month), 0).getDate()
}

function formatBirthDateLabel(value) {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

function splitBirthDate(value) {
  if (!value) return { year: '', month: '', day: '' }
  const [year = '', month = '', day = ''] = String(value).split('-')
  return { year, month, day }
}

/** select에 숫자를 치면 해당 옵션으로 이동합니다. */
function createDigitTypeahead({ maxLength, matchValue }) {
  let buffer = ''
  let timer = null

  return function onKeyDown(event) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      buffer = buffer.slice(0, -1)
      if (buffer) matchValue(buffer)
      return
    }

    if (!/^\d$/.test(event.key)) return

    event.preventDefault()
    buffer = (buffer + event.key).slice(-maxLength)
    matchValue(buffer)

    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      buffer = ''
    }, 2500)
  }
}

function matchByDigits(options, buffer, { pad = 0 } = {}) {
  if (!buffer) return ''
  const exact = pad > 0 ? buffer.padStart(pad, '0') : buffer
  if (options.includes(exact)) return exact
  if (options.includes(buffer)) return buffer

  const starts = options.filter(
    (option) => option.startsWith(buffer) || option.startsWith(exact),
  )
  return starts[0] || ''
}

function App() {
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [period, setPeriod] = useState('') // 오전 | 오후 | ''
  const [hour, setHour] = useState('') // 1~12 | ''
  const [minute, setMinute] = useState('') // 00~59 | ''
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState(false)
  const [showMissing, setShowMissing] = useState(false)

  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedName, setSelectedName] = useState('')
  const [listError, setListError] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profileReady, setProfileReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showProfileCreate, setShowProfileCreate] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareNote, setShareNote] = useState('')
  const [readingCount, setReadingCount] = useState(null)
  const [hasEntered, setHasEntered] = useState(false)
  const loadedSnapshotRef = useRef('')
  const pendingRestoreRef = useRef(false)

  const birthTimeText = formatBirthTime({ period, hour, minute })
  const maxMonth =
    birthYear === String(CURRENT_YEAR)
      ? String(TODAY.getMonth() + 1).padStart(2, '0')
      : '12'
  const monthOptions = MONTH_OPTIONS.filter((month) => month <= maxMonth)
  const maxDay =
    birthYear === String(CURRENT_YEAR) &&
    birthMonth === String(TODAY.getMonth() + 1).padStart(2, '0')
      ? TODAY.getDate()
      : daysInMonth(birthYear, birthMonth)
  const dayOptions = Array.from({ length: maxDay }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  )
  const birthDate =
    birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth}-${birthDay}`
      : ''
  const birthDateLabel = formatBirthDateLabel(birthDate)
  const isViewing = Boolean(selectedId && result)
  const missing = {
    name: name.trim() === '',
    birthDate: birthDate === '',
    gender: gender === '',
    calendarType: calendarType === '',
  }

  const onHourTypeahead = useMemo(
    () =>
      createDigitTypeahead({
        maxLength: 2,
        matchValue: (buffer) => {
          const next = matchByDigits(HOUR_OPTIONS, buffer)
          if (next) setHour(next)
        },
      }),
    [],
  )

  const onMinuteTypeahead = useMemo(
    () =>
      createDigitTypeahead({
        maxLength: 2,
        matchValue: (buffer) => {
          const next = matchByDigits(MINUTE_OPTIONS, buffer, { pad: 2 })
          if (next) setMinute(next)
        },
      }),
    [],
  )

  function onPeriodTypeahead(event) {
    if (event.key === '1') {
      event.preventDefault()
      setPeriod('오전')
      return
    }
    if (event.key === '2') {
      event.preventDefault()
      setPeriod('오후')
    }
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

  function getLockedResultParts(text) {
    const paragraphs = resultParagraphs(text)
    return {
      visible: paragraphs.slice(0, 2),
      hidden: paragraphs.slice(2),
    }
  }

  function savePendingReading(snapshot) {
    try {
      window.sessionStorage.setItem(PENDING_READING_KEY, JSON.stringify(snapshot))
    } catch {
      // sessionStorage 불가 시 무시
    }
  }

  function readPendingReading() {
    try {
      const raw = window.sessionStorage.getItem(PENDING_READING_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function clearPendingReading() {
    try {
      window.sessionStorage.removeItem(PENDING_READING_KEY)
    } catch {
      // ignore
    }
  }

  function applyBirthDate(value) {
    const { year, month, day } = splitBirthDate(value)
    setBirthYear(year)
    setBirthMonth(month)
    setBirthDay(day)
  }

  function clearFormFields() {
    setName('')
    setBirthYear('')
    setBirthMonth('')
    setBirthDay('')
    setPeriod('')
    setHour('')
    setMinute('')
    setGender('')
    setCalendarType('')
  }

  function applyProfileToForm(nextProfile = profile) {
    const values = profileToFormValues(nextProfile)
    if (!values) {
      clearFormFields()
      return
    }
    setName(values.name)
    setBirthYear(values.birthYear)
    setBirthMonth(values.birthMonth)
    setBirthDay(values.birthDay)
    setPeriod(values.period)
    setHour(values.hour)
    setMinute(values.minute)
    setGender(values.gender)
    setCalendarType(values.calendarType)
  }

  function snapshotOf(values) {
    return [
      values.name.trim(),
      values.birthDate,
      values.period,
      values.hour,
      values.minute,
      values.gender,
      values.calendarType,
    ].join('|')
  }

  function currentSnapshot() {
    return snapshotOf({
      name,
      birthDate,
      period,
      hour,
      minute,
      gender,
      calendarType,
    })
  }

  function leaveViewingIfEdited() {
    // 열람 중 수정해도 같은 기록을 갱신(Update)할 수 있도록 선택 상태를 유지합니다.
  }

  function focusField(id) {
    requestAnimationFrame(() => {
      document.getElementById(id)?.focus()
    })
  }

  function focusFirstMissing(nextMissing = missing) {
    if (nextMissing.name) {
      focusField('name')
      return
    }
    if (!birthYear) {
      focusField('birthYear')
      return
    }
    if (!birthMonth) {
      focusField('birthMonth')
      return
    }
    if (!birthDay) {
      focusField('birthDay')
      return
    }
    if (nextMissing.gender) {
      focusField('gender')
      return
    }
    if (nextMissing.calendarType) focusField('calendarType')
  }

  async function loadReadings() {
    if (!user) {
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
  }

  async function loadProfiles(nextUser = user) {
    if (!nextUser) {
      setProfile(null)
      setProfiles([])
      setProfileReady(false)
      setShowOnboarding(false)
      setShowProfileCreate(false)
      setShowProfileEdit(false)
      setProfileError('')
      return
    }

    setProfileReady(false)
    setProfileError('')
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('owner_id', nextUser.id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error(fetchError)
      setProfileError(
        formatSupabaseError(fetchError, '프로필을 불러오지 못했습니다.'),
      )
      setProfiles([])
      setProfile(null)
      setProfileReady(true)
      setShowOnboarding(true)
      return
    }

    const list = data ?? []
    setProfiles(list)
    setProfileReady(true)

    if (list.length === 0) {
      setProfile(null)
      setShowOnboarding(true)
      return
    }

    const savedId = window.localStorage.getItem(SELECTED_PROFILE_KEY)
    const selected =
      list.find((item) => item.id === savedId) || list[0]

    setProfile(selected)
    window.localStorage.setItem(SELECTED_PROFILE_KEY, selected.id)
    setShowOnboarding(false)
    applyProfileToForm(selected)
  }

  function handleSelectProfile(profileId) {
    const selected = profiles.find((item) => item.id === profileId)
    if (!selected) return
    setProfile(selected)
    window.localStorage.setItem(SELECTED_PROFILE_KEY, selected.id)
    if (!selectedId) {
      applyProfileToForm(selected)
      loadedSnapshotRef.current = ''
    }
  }

  useEffect(() => {
    let mounted = true

    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const oauthError =
      search.get('error_description') ||
      search.get('error') ||
      hash.get('error_description') ||
      hash.get('error')
    if (oauthError) {
      setAuthError(
        formatSupabaseError(
          decodeURIComponent(oauthError.replace(/\+/g, ' ')),
          '로그인에 실패했습니다.',
        ),
      )
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) {
        console.error(sessionError)
        setAuthError(sessionError.message || '로그인 상태를 확인하지 못했습니다.')
      }
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
      if (event === 'SIGNED_IN') {
        setAuthError('')
        setAuthBusy(false)
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
      if (event === 'SIGNED_OUT') {
        setAuthBusy(false)
        setProfile(null)
        setProfiles([])
        setProfileReady(false)
        setShowOnboarding(false)
        setShowProfileCreate(false)
        setShowProfileEdit(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    loadReadings()
  }, [authReady, user?.id])

  useEffect(() => {
    if (!authReady) return
    loadProfiles(user)
  }, [authReady, user?.id])

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

  async function handleGoogleLogin() {
    setAuthBusy(true)
    setAuthError('')

    if (result) {
      savePendingReading({
        name,
        birthDate,
        period,
        hour,
        minute,
        gender,
        calendarType,
        result,
      })
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'online',
          prompt: 'select_account',
        },
      },
    })
    if (oauthError) {
      console.error(oauthError)
      setAuthError(oauthError.message || 'Google 로그인에 실패했습니다.')
      setAuthBusy(false)
    }
  }

  async function handleLogout() {
    setAuthBusy(true)
    setAuthError('')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error(signOutError)
      setAuthError(signOutError.message || '로그아웃에 실패했습니다.')
      setAuthBusy(false)
      return
    }
    clearFormFields()
    setResult('')
    setSelectedId(null)
    setSelectedName('')
    setReadings([])
    setAuthBusy(false)
  }

  async function handleSaveProfile(payload) {
    if (!user) return
    setProfileBusy(true)
    setProfileError('')

    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      console.error(refreshError)
      setProfileError(
        formatSupabaseError(
          refreshError,
          '로그인 세션을 갱신하지 못했습니다. 다시 로그인해 주세요.',
        ),
      )
      setProfileBusy(false)
      return
    }

    const isEdit = Boolean(showProfileEdit && profile?.id)
    let data = null
    let saveError = null

    if (isEdit) {
      const result = await supabase
        .from('profiles')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .eq('owner_id', user.id)
        .select(PROFILE_FIELDS)
        .single()
      data = result.data
      saveError = result.error
    } else {
      const result = await supabase
        .from('profiles')
        .insert({
          owner_id: user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .select(PROFILE_FIELDS)
        .single()
      data = result.data
      saveError = result.error
    }

    if (saveError) {
      console.error(saveError)
      setProfileError(
        formatSupabaseError(saveError, '프로필 저장에 실패했습니다.'),
      )
      setProfileBusy(false)
      return
    }

    const nextList = isEdit
      ? profiles.map((item) => (item.id === data.id ? data : item))
      : [...profiles, data]

    setProfiles(nextList)
    setProfile(data)
    window.localStorage.setItem(SELECTED_PROFILE_KEY, data.id)
    setShowOnboarding(false)
    setShowProfileCreate(false)
    setShowProfileEdit(false)
    setProfileBusy(false)

    if (!selectedId) {
      applyProfileToForm(data)
      loadedSnapshotRef.current = ''
    }
  }

  useEffect(() => {
    if (birthMonth && birthMonth > maxMonth) {
      setBirthMonth('')
      setBirthDay('')
      return
    }
    if (birthDay && Number(birthDay) > maxDay) {
      setBirthDay('')
    }
  }, [birthYear, birthMonth, birthDay, maxMonth, maxDay])

  useEffect(() => {
    if (!showMissing) return
    if (!missing.name && !missing.birthDate && !missing.gender && !missing.calendarType) {
      setShowMissing(false)
    }
  }, [showMissing, missing.name, missing.birthDate, missing.gender, missing.calendarType])

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

  function isFormComplete() {
    // 시간은 선택 사항 — 이름·생년월일·성별·양력/음력만 필수
    return !missing.name && !missing.birthDate && !missing.gender && !missing.calendarType
  }

  function scrollToResult() {
    requestAnimationFrame(() => {
      document.getElementById('result-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    })
  }

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
    setName(nextName)
    applyBirthDate(nextBirth)
    setPeriod(nextPeriod)
    setHour(nextHour)
    setMinute(nextMinute)
    setGender(nextGender)
    setCalendarType(nextCalendar)
    setResult(normalizeResultText(reading.result))
    setError('')
    setShowMissing(false)
    setWarning(false)
    loadedSnapshotRef.current = snapshotOf({
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
    if (profile) applyProfileToForm()
    else clearFormFields()
    setResult('')
    setSelectedId(null)
    setSelectedName('')
    setError('')
    setShareNote('')
    setWarning(false)
    setShowMissing(false)
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

  async function persistReading({
    text,
    editingId = null,
    values,
    nextUser = user,
    nextProfile = profile,
  }) {
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
  }

  async function handleAnalyze() {
    setError('')
    setAuthError('')

    if (!isFormComplete()) {
      setShowMissing(true)
      setWarning(true)
      focusFirstMissing()
      return
    }

    if (user && !profile) {
      setShowOnboarding(true)
      setProfileError('저장하려면 먼저 명식 프로필을 등록해 주세요.')
    }

    const editingId = user && profile ? selectedId : null
    setResult('')
    setShowMissing(false)
    setWarning(false)
    setLoading(true)

    const values = {
      name,
      birthDate,
      period,
      hour,
      minute,
      gender,
      calendarType,
    }

    try {
      const prompt = buildSajuPrompt(values)
      const text = normalizeResultText(await generateSajuReading(prompt))
      setResult(text)
      setSelectedName(name.trim())

      if (!user) {
        savePendingReading({ ...values, result: text })
        setSelectedId(null)
        scrollToResult()
        return
      }

      if (!profile) {
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
      loadedSnapshotRef.current = currentSnapshot()
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
    const title = `${selectedName || name || '사주'}님의 사주`
    const text = '백 선생이 풀어 준 사주를 확인해 보세요.'

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl })
        setShareNote('공유 창을 열었습니다.')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareNote('공유 링크를 복사했습니다.')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setShareNote('공유 링크를 복사했습니다.')
        } catch {
          setShareNote(`이 링크를 복사해 공유하세요: ${shareUrl}`)
        }
      }
    } finally {
      setShareBusy(false)
    }
  }

  useEffect(() => {
    if (!authReady || !user || !profileReady) return
    if (pendingRestoreRef.current) return

    const pending = readPendingReading()
    if (!pending?.result) return

    pendingRestoreRef.current = true

    setName(pending.name || '')
    applyBirthDate(pending.birthDate || '')
    setPeriod(pending.period || '')
    setHour(pending.hour || '')
    setMinute(pending.minute || '')
    setGender(pending.gender || '')
    setCalendarType(pending.calendarType || '')
    setResult(normalizeResultText(pending.result))
    setSelectedName((pending.name || '').trim())
    setSelectedId(null)
    scrollToResult()

    if (!profile) {
      setShowOnboarding(true)
      setProfileError('전체 천기를 보관하려면 명식을 등록해 주세요.')
      pendingRestoreRef.current = false
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await persistReading({
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
          nextUser: user,
          nextProfile: profile,
        })
        if (cancelled) return
        clearPendingReading()
        setSelectedId(data.id)
        setReadings((prev) => {
          if (prev.some((item) => item.id === data.id)) return prev
          return [data, ...prev]
        })
        setReadingCount((prev) =>
          typeof prev === 'number' ? prev + 1 : prev,
        )
        loadedSnapshotRef.current = snapshotOf({
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
  }, [authReady, user?.id, profileReady, profile?.id])

  function fieldClass(isIncomplete) {
    return showMissing && isIncomplete ? 'field is-missing' : 'field'
  }

  const isGuest = !user
  const isResultLocked = Boolean(result && isGuest)
  const lockedParts = isResultLocked
    ? getLockedResultParts(result)
    : { visible: resultParagraphs(result), hidden: [] }
  const showWelcomeGate = !hasEntered

  function handleEnterApp() {
    setHasEntered(true)
  }

  if (!authReady || showWelcomeGate) {
    return (
      <div className="page page-gate">
        <div className="atmosphere" aria-hidden="true" />
        <div className="gate-veil" aria-hidden="true" />

        <main className="gate" aria-label="입장">
          <p className="gate-eyebrow">전통 명식 · 운명 해석</p>
          <h1 className="gate-brand">백 선생의 사주</h1>
          <p className="gate-lede">
            생시와 명식을 아뢰면, 담담하고 또렷하게 천기를 풀어 드립니다.
          </p>

          {!authReady ? (
            <p className="gate-status" role="status">
              문 앞에서 신명을 확인하는 중...
            </p>
          ) : (
            <>
              <button
                type="button"
                className="gate-cta"
                onClick={handleEnterApp}
              >
                들어가기
              </button>
              {typeof readingCount === 'number' && readingCount > 0 ? (
                <p className="gate-trust">
                  이때까지 총{' '}
                  <span>{readingCount.toLocaleString('ko-KR')}</span>
                  개의 사주가 생성되었습니다
                </p>
              ) : null}
            </>
          )}
        </main>
      </div>
    )
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
            <p className="reading-subtext">잠시만 기다려 주세요</p>
          </div>
        </div>
      )}

      {warning && (
        <div
          className="omen-overlay"
          role="alertdialog"
          aria-modal="true"
          onClick={() => setWarning(false)}
        >
          <div
            className="omen-warning"
            onClick={(event) => event.stopPropagation()}
          >
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

      {deleteTarget && (
        <div
          className="omen-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-omen-title"
          onClick={() => {
            if (!deleteBusy) setDeleteTarget(null)
          }}
        >
          <div
            className="omen-warning omen-delete"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="delete-omen-title" className="omen-title">
              명부의 소각
            </p>
            <p className="omen-text">
              <strong>{deleteTarget.name}</strong>의 사주가
              <br />
              명부에서 영원히 지워지리라.
              <br />
              한 번 태운 글은 되돌릴 수 없다.
              <br />
              참으로 소각할 것인가?
            </p>
            <div className="omen-actions">
              <button
                type="button"
                className="omen-keep"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
              >
                아직 두지 않으리
              </button>
              <button
                type="button"
                className="omen-burn"
                onClick={confirmDeleteReading}
                disabled={deleteBusy}
              >
                {deleteBusy ? '소각하는 중...' : '명부에서 태우리'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        mode="onboarding"
        open={Boolean(user && profileReady && showOnboarding)}
        initialProfile={null}
        busy={profileBusy}
        error={profileError}
        onSave={handleSaveProfile}
        onClose={() => {
          setShowOnboarding(false)
          setProfileError('')
        }}
      />

      <ProfileModal
        mode="create"
        open={Boolean(user && showProfileCreate)}
        initialProfile={null}
        busy={profileBusy}
        error={profileError}
        onSave={handleSaveProfile}
        onClose={() => {
          setShowProfileCreate(false)
          setProfileError('')
        }}
      />

      <ProfileModal
        mode="edit"
        open={Boolean(user && showProfileEdit)}
        initialProfile={profile}
        busy={profileBusy}
        error={profileError}
        onSave={handleSaveProfile}
        onClose={() => {
          setShowProfileEdit(false)
          setProfileError('')
        }}
      />

      <div className="layout">
        <aside className="sidebar" aria-label="저장된 사주 목록">
          <div className="auth-box">
            {!authReady ? (
              <p className="auth-status">로그인 확인 중...</p>
            ) : user ? (
              <>
                <p className="auth-status">
                  {user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email ||
                    '로그인됨'}
                </p>

                {profiles.length > 0 ? (
                  <>
                    <label
                      className="profile-select-label"
                      htmlFor="profile-select"
                    >
                      프로필 선택
                    </label>
                    <select
                      id="profile-select"
                      className="profile-select"
                      value={profile?.id || ''}
                      onChange={(event) =>
                        handleSelectProfile(event.target.value)
                      }
                      disabled={profileBusy}
                    >
                      {profiles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {profile ? (
                      <p className="auth-meta">
                        {[
                          formatBirthDateLabel(profile.birth_date),
                          profile.gender,
                          profile.calendar_type,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                  </>
                ) : profileReady ? (
                  <p className="auth-meta">명식 미등록 · 프로필을 추가하세요</p>
                ) : (
                  <p className="auth-meta">명식 불러오는 중...</p>
                )}

                <button
                  type="button"
                  className="auth-button auth-button-google"
                  onClick={() => {
                    setProfileError('')
                    if (profiles.length === 0) setShowOnboarding(true)
                    else setShowProfileCreate(true)
                  }}
                  disabled={!profileReady || profileBusy}
                >
                  프로필 추가
                </button>
                <button
                  type="button"
                  className="auth-button"
                  onClick={() => {
                    setProfileError('')
                    setShowProfileEdit(true)
                  }}
                  disabled={!profileReady || !profile || profileBusy}
                >
                  프로필 수정
                </button>
                <button
                  type="button"
                  className="auth-button auth-button-ghost"
                  onClick={handleLogout}
                  disabled={authBusy}
                >
                  {authBusy ? '처리 중...' : '로그아웃'}
                </button>
              </>
            ) : (
              <>
                <p className="auth-status">손님으로 천기를 엿보는 중</p>
                <p className="auth-meta">
                  먼저 사주를 풀어보고, 전체 결과는 로그인 후 여세요.
                </p>
                <button
                  type="button"
                  className="auth-button auth-button-google"
                  onClick={handleGoogleLogin}
                  disabled={authBusy}
                >
                  {authBusy ? 'Google로 이동 중...' : 'Google로 들어가기'}
                </button>
              </>
            )}
            {authError ? <p className="auth-error">{authError}</p> : null}
          </div>

          {user ? (
            <>
              <h2 className="sidebar-title">명부</h2>
              <p className="sidebar-lede">
                {listLoading
                  ? '불러오는 중...'
                  : readings.length > 0
                    ? `저장된 사주 · ${readings.length}명`
                    : '저장된 사주'}
              </p>
              {!listLoading && !listError && readings.length === 0 ? (
                <p className="sidebar-empty sidebar-empty-above">
                  아직 기록된 이름이 없습니다.
                </p>
              ) : null}
              <button
                type="button"
                className="sidebar-new"
                onClick={handleNewReading}
                disabled={!profile}
              >
                새 사주 보기
              </button>
              {listError ? (
                <div className="sidebar-empty-wrap">
                  <p className="sidebar-empty">{listError}</p>
                  <button
                    type="button"
                    className="sidebar-retry"
                    onClick={loadReadings}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : listLoading ? (
                <p className="sidebar-empty">명부를 펼치는 중...</p>
              ) : readings.length > 0 ? (
                <ul className="sidebar-list">
                  {readings.map((reading) => (
                    <li key={reading.id} className="sidebar-item">
                      <button
                        type="button"
                        className={
                          selectedId === reading.id
                            ? 'sidebar-name is-active'
                            : 'sidebar-name'
                        }
                        onClick={() => handleSelectReading(reading)}
                      >
                        <span className="sidebar-name-text">{reading.name}</span>
                        {reading.birth_date && (
                          <span className="sidebar-name-meta">
                            {formatBirthDateLabel(reading.birth_date)}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="sidebar-delete"
                        aria-label={`${reading.name} 기록 삭제`}
                        onClick={(event) => {
                          event.stopPropagation()
                          requestDeleteReading(reading.id)
                        }}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </aside>

        <main className="shell">
          <header className="hero">
            <p className="eyebrow">전통 명식 · 운명 해석</p>
            <h1 className="brand">백 선생의 사주</h1>
            <p className="lede">
              {profile
                ? `${profile.name}님의 명식을 불러와 풀이합니다.`
                : isGuest
                  ? '로그인 없이도 먼저 풀어볼 수 있습니다. 전체 천기는 로그인 후 열립니다.'
                  : '생시와 명식을 바탕으로, 담담하고 또렷하게 풀이합니다.'}
            </p>
            {typeof readingCount === 'number' && readingCount > 0 ? (
              <p className="trust-count">
                이때까지 총{' '}
                <span>{readingCount.toLocaleString('ko-KR')}</span>
                개의 사주가 생성되었습니다
              </p>
            ) : null}
          </header>

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
                  onClick={handleGoogleLogin}
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
                  onClick={() => {
                    setProfileError('')
                    setShowProfileCreate(true)
                  }}
                >
                  프로필을 추가
                </button>
                하거나
                <button
                  type="button"
                  className="profile-note-link"
                  onClick={() => {
                    setProfileError('')
                    setShowProfileEdit(true)
                  }}
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
                  onClick={() => {
                    setProfileError('')
                    setShowOnboarding(true)
                  }}
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

            <div className={fieldClass(missing.name)}>
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
                  if (e.key === 'Enter') handleAnalyze()
                }}
                placeholder="이름을 입력하세요"
                autoComplete="name"
              />
            </div>

            <div className={fieldClass(missing.birthDate)}>
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
              <div className={fieldClass(missing.gender)}>
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

              <div className={fieldClass(missing.calendarType)}>
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
                onClick={handleAnalyze}
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
                  onClick={handleNewReading}
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
                onClick={() => requestDeleteReading(selectedId)}
                disabled={loading}
              >
                이 기록 삭제
              </button>
            )}

            {error && <p className="error">{error}</p>}
          </section>

          {result && (
            <section
              id="result-panel"
              className={
                isResultLocked
                  ? 'result-panel is-locked'
                  : 'result-panel'
              }
              aria-live="polite"
            >
              <p className="result-eyebrow">
                {isResultLocked ? '천기 · 미리보기' : '천기 · 풀이'}
              </p>
              <h2>
                {selectedName ? `${selectedName}님의 사주` : '해석'}
              </h2>
              {(birthDateLabel || gender || calendarType) && (
                <p className="result-meta">
                  {[
                    birthDateLabel,
                    gender,
                    calendarType,
                    birthTimeText !== '--:--' ? birthTimeText : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <div className="result-body">
                {lockedParts.visible.map((paragraph, index) => (
                  <p key={`${selectedId || 'live'}-visible-${index}`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {isResultLocked && (
                <div className="result-lock">
                  <div className="result-lock-preview" aria-hidden="true">
                    {(lockedParts.hidden.length
                      ? lockedParts.hidden.slice(0, 2)
                      : ['봉인된 문장이 이곳에 이어진다.']
                    ).map((paragraph, index) => (
                      <p key={`hidden-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="result-lock-veil">
                    <p className="result-lock-title">나머지 천기는 봉인되어 있다</p>
                    <p className="result-lock-text">
                      Google로 들어가면 전체 풀이를 열고
                      <br />
                      명부에 남길 수 있습니다.
                    </p>
                    <button
                      type="button"
                      className="gate-cta result-lock-cta"
                      onClick={handleGoogleLogin}
                      disabled={authBusy}
                    >
                      {authBusy ? '문을 여는 중...' : '로그인하고 전체 보기'}
                    </button>
                  </div>
                </div>
              )}

              {selectedId && !isResultLocked && (
                <div className="share-actions">
                  <button
                    type="button"
                    className="cta-share"
                    onClick={handleShareReading}
                    disabled={shareBusy || loading}
                  >
                    {shareBusy ? '링크 준비 중...' : '친구에게 공유하기'}
                  </button>
                  {shareNote ? <p className="share-note">{shareNote}</p> : null}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
