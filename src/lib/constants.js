export const PROFILE_FIELDS =
  'id, owner_id, name, birth_date, period, hour, minute, gender, calendar_type, created_at, updated_at'

export const READING_FIELDS =
  'id, name, birth_date, period, hour, minute, gender, calendar_type, result, created_at, profile_id, share_token, is_shared'

export const SELECTED_PROFILE_KEY = 'saju-me-selected-profile'
export const PENDING_READING_KEY = 'saju-me-pending-reading'

export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1))
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
)
