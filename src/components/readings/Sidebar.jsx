import { AuthBox } from '../auth'
import ReadingList from './ReadingList'

export default function Sidebar({
  authReady,
  user,
  authBusy,
  authError,
  profiles,
  profile,
  profileReady,
  profileBusy,
  readings,
  selectedId,
  listLoading,
  listError,
  onSelectProfile,
  onAddProfile,
  onEditProfile,
  onLogout,
  onLogin,
  onNewReading,
  onSelectReading,
  onDeleteReading,
  onRetry,
}) {
  return (
    <aside className="sidebar" aria-label="저장된 사주 목록">
      <AuthBox
        authReady={authReady}
        user={user}
        authBusy={authBusy}
        authError={authError}
        profiles={profiles}
        profile={profile}
        profileReady={profileReady}
        profileBusy={profileBusy}
        onSelectProfile={onSelectProfile}
        onAddProfile={onAddProfile}
        onEditProfile={onEditProfile}
        onLogout={onLogout}
        onLogin={onLogin}
      />

      {user ? (
        <ReadingList
          readings={readings}
          selectedId={selectedId}
          listLoading={listLoading}
          listError={listError}
          profile={profile}
          onNewReading={onNewReading}
          onSelectReading={onSelectReading}
          onDeleteReading={onDeleteReading}
          onRetry={onRetry}
        />
      ) : null}
    </aside>
  )
}
