import { splitBirthDate } from './date'

export function emptyProfileForm() {
  return {
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    period: '',
    hour: '',
    minute: '',
    gender: '',
    calendarType: '',
  }
}

export function formFromProfile(profile) {
  if (!profile) return emptyProfileForm()
  const { year, month, day } = splitBirthDate(profile.birth_date)
  return {
    name: profile.name || '',
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    period: profile.period || '',
    hour: profile.hour || '',
    minute: profile.minute || '',
    gender: profile.gender || '',
    calendarType: profile.calendar_type || '',
  }
}

export function profileToFormValues(profile) {
  if (!profile) return null
  return formFromProfile(profile)
}
