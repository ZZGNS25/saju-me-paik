import { formatBirthDateLabel } from '../../lib/date'

export default function AuthBox({
  authReady,
  user,
  authBusy,
  authError,
  profiles,
  profile,
  profileReady,
  profileBusy,
  onSelectProfile,
  onAddProfile,
  onEditProfile,
  onLogout,
  onLogin,
}) {
  return (
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
              <label className="profile-select-label" htmlFor="profile-select">
                프로필 선택
              </label>
              <select
                id="profile-select"
                className="profile-select"
                value={profile?.id || ''}
                onChange={(event) => onSelectProfile(event.target.value)}
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
            onClick={onAddProfile}
            disabled={!profileReady || profileBusy}
          >
            프로필 추가
          </button>
          <button
            type="button"
            className="auth-button"
            onClick={onEditProfile}
            disabled={!profileReady || !profile || profileBusy}
          >
            프로필 수정
          </button>
          <button
            type="button"
            className="auth-button auth-button-ghost"
            onClick={onLogout}
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
            onClick={onLogin}
            disabled={authBusy}
          >
            {authBusy ? 'Google로 이동 중...' : 'Google로 들어가기'}
          </button>
        </>
      )}
      {authError ? <p className="auth-error">{authError}</p> : null}
    </div>
  )
}
