import { useCallback, useEffect, useRef, useState } from 'react'
import { PROFILE_FIELDS, SELECTED_PROFILE_KEY } from '../lib/constants'
import { supabase, formatSupabaseError } from '../lib/supabase'

export function useProfiles({ user, authReady, selectedId, applyProfileToForm }) {
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profileReady, setProfileReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showProfileCreate, setShowProfileCreate] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState('')
  const applyProfileToFormRef = useRef(applyProfileToForm)
  applyProfileToFormRef.current = applyProfileToForm

  const loadProfiles = useCallback(async (nextUser) => {
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
    const selected = list.find((item) => item.id === savedId) || list[0]

    setProfile(selected)
    window.localStorage.setItem(SELECTED_PROFILE_KEY, selected.id)
    setShowOnboarding(false)
    applyProfileToFormRef.current(selected)
  }, [])

  function handleSelectProfile(profileId) {
    const selected = profiles.find((item) => item.id === profileId)
    if (!selected) return
    setProfile(selected)
    window.localStorage.setItem(SELECTED_PROFILE_KEY, selected.id)
    if (!selectedId) {
      applyProfileToForm(selected)
    }
  }

  function resetProfiles() {
    setProfile(null)
    setProfiles([])
    setProfileReady(false)
    setShowOnboarding(false)
    setShowProfileCreate(false)
    setShowProfileEdit(false)
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
    }

    return data
  }

  useEffect(() => {
    if (!authReady) return
    loadProfiles(user)
  }, [authReady, user, loadProfiles])

  return {
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
    loadProfiles,
    handleSelectProfile,
    handleSaveProfile,
    resetProfiles,
  }
}
