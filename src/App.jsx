import { useSajuApp } from './hooks/useSajuApp'
import { Atmosphere, Hero } from './components/layout'
import { WelcomeGate } from './components/welcome'
import { ProfileModal } from './components/profile'
import { SajuForm, WarningModal } from './components/form'
import { ResultPanel, ReadingOverlay } from './components/result'
import { Sidebar, DeleteConfirmModal } from './components/readings'

export default function App() {
  const app = useSajuApp()

  if (!app.authReady || app.showWelcomeGate) {
    return (
      <WelcomeGate
        authReady={app.authReady}
        readingCount={app.readingCount}
        onEnter={app.handleEnterApp}
      />
    )
  }

  return (
    <div className="page">
      <Atmosphere />

      {app.loading ? <ReadingOverlay /> : null}

      <WarningModal open={app.warning} onClose={() => app.setWarning(false)} />

      <DeleteConfirmModal
        target={app.deleteTarget}
        busy={app.deleteBusy}
        onCancel={() => app.setDeleteTarget(null)}
        onConfirm={app.confirmDeleteReading}
      />

      <ProfileModal
        mode="onboarding"
        open={Boolean(app.user && app.profileReady && app.showOnboarding)}
        initialProfile={null}
        busy={app.profileBusy}
        error={app.profileError}
        onSave={app.handleSaveProfile}
        onClose={() => {
          app.setShowOnboarding(false)
          app.setProfileError('')
        }}
      />

      <ProfileModal
        mode="create"
        open={Boolean(app.user && app.showProfileCreate)}
        initialProfile={null}
        busy={app.profileBusy}
        error={app.profileError}
        onSave={app.handleSaveProfile}
        onClose={() => {
          app.setShowProfileCreate(false)
          app.setProfileError('')
        }}
      />

      <ProfileModal
        mode="edit"
        open={Boolean(app.user && app.showProfileEdit)}
        initialProfile={app.profile}
        busy={app.profileBusy}
        error={app.profileError}
        onSave={app.handleSaveProfile}
        onClose={() => {
          app.setShowProfileEdit(false)
          app.setProfileError('')
        }}
      />

      <div className="layout">
        <Sidebar
          authReady={app.authReady}
          user={app.user}
          authBusy={app.authBusy}
          authError={app.authError}
          profiles={app.profiles}
          profile={app.profile}
          profileReady={app.profileReady}
          profileBusy={app.profileBusy}
          readings={app.readings}
          selectedId={app.selectedId}
          listLoading={app.listLoading}
          listError={app.listError}
          onSelectProfile={app.handleSelectProfile}
          onAddProfile={app.openProfileCreate}
          onEditProfile={app.openProfileEdit}
          onLogout={app.handleLogout}
          onLogin={app.handleGoogleLogin}
          onNewReading={app.handleNewReading}
          onSelectReading={app.handleSelectReading}
          onDeleteReading={app.requestDeleteReading}
          onRetry={app.loadReadings}
        />

        <main className="shell">
          <Hero
            profile={app.profile}
            isGuest={app.isGuest}
            readingCount={app.readingCount}
          />

          <SajuForm
            form={app.form}
            isViewing={app.isViewing}
            isGuest={app.isGuest}
            user={app.user}
            profiles={app.profiles}
            profile={app.profile}
            profileReady={app.profileReady}
            selectedId={app.selectedId}
            selectedName={app.selectedName}
            result={app.result}
            loading={app.loading}
            error={app.error}
            onLogin={app.handleGoogleLogin}
            onOpenCreate={app.openProfileCreate}
            onOpenEdit={app.openProfileEdit}
            onOpenOnboarding={app.openOnboarding}
            onAnalyze={app.handleAnalyze}
            onNewReading={app.handleNewReading}
            onDelete={() => app.requestDeleteReading(app.selectedId)}
            leaveViewingIfEdited={app.leaveViewingIfEdited}
          />

          {app.result ? (
            <ResultPanel
              locked={app.isResultLocked}
              eyebrow={app.isResultLocked ? '천기 · 미리보기' : '천기 · 풀이'}
              title={
                app.selectedName ? `${app.selectedName}님의 사주` : '해석'
              }
              metaItems={[
                app.birthDateLabel,
                app.form.gender,
                app.form.calendarType,
                app.form.birthTimeText !== '--:--'
                  ? app.form.birthTimeText
                  : '',
              ]}
              visibleParagraphs={app.lockedParts.visible}
              hiddenParagraphs={app.lockedParts.hidden}
              paragraphKey={app.selectedId || 'live'}
              onLogin={app.handleGoogleLogin}
              authBusy={app.authBusy}
              onShare={
                app.selectedId && !app.isResultLocked
                  ? app.handleShareReading
                  : undefined
              }
              shareBusy={app.shareBusy || app.loading}
              shareNote={app.shareNote}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
