import { useEffect, useMemo, useState } from 'react'
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../lib/constants'
import { formatBirthTime, getDateSelectOptions, splitBirthDate } from '../lib/date'
import { fieldClass, focusField } from '../lib/dom'
import { profileToFormValues } from '../lib/profileForm'
import { createDigitTypeahead, matchByDigits } from '../lib/typeahead'

export function useSajuForm() {
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [period, setPeriod] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')
  const [showMissing, setShowMissing] = useState(false)

  const birthTimeText = formatBirthTime({ period, hour, minute })
  const { maxMonth, monthOptions, maxDay, dayOptions } = getDateSelectOptions(
    birthYear,
    birthMonth,
  )
  const birthDate =
    birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth}-${birthDay}`
      : ''

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

  function applyProfileToForm(nextProfile) {
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

  function currentValues() {
    return {
      name,
      birthDate,
      period,
      hour,
      minute,
      gender,
      calendarType,
    }
  }

  function isFormComplete() {
    return !missing.name && !missing.birthDate && !missing.gender && !missing.calendarType
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

  function getFieldClass(isIncomplete) {
    return fieldClass(showMissing, isIncomplete)
  }

  return {
    name,
    setName,
    birthYear,
    setBirthYear,
    birthMonth,
    setBirthMonth,
    birthDay,
    setBirthDay,
    period,
    setPeriod,
    hour,
    setHour,
    minute,
    setMinute,
    gender,
    setGender,
    calendarType,
    setCalendarType,
    showMissing,
    setShowMissing,
    birthTimeText,
    monthOptions,
    dayOptions,
    birthDate,
    missing,
    onHourTypeahead,
    onMinuteTypeahead,
    onPeriodTypeahead,
    applyBirthDate,
    clearFormFields,
    applyProfileToForm,
    snapshotOf,
    currentSnapshot,
    currentValues,
    isFormComplete,
    focusFirstMissing,
    getFieldClass,
  }
}
