import { useEffect, useRef, useState } from 'react'
import { supabase, formatSupabaseError } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const onAuthEventRef = useRef(null)

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
      }
      onAuthEventRef.current?.(event, session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleGoogleLogin() {
    setAuthBusy(true)
    setAuthError('')

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
      return false
    }
    setAuthBusy(false)
    return true
  }

  return {
    user,
    authReady,
    authBusy,
    authError,
    setAuthError,
    onAuthEventRef,
    handleGoogleLogin,
    handleLogout,
  }
}
