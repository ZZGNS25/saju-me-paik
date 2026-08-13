/** select에 숫자를 치면 해당 옵션으로 이동합니다. */
export function createDigitTypeahead({ maxLength, matchValue }) {
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

export function matchByDigits(options, buffer, { pad = 0 } = {}) {
  if (!buffer) return ''
  const exact = pad > 0 ? buffer.padStart(pad, '0') : buffer
  if (options.includes(exact)) return exact
  if (options.includes(buffer)) return buffer

  const starts = options.filter(
    (option) => option.startsWith(buffer) || option.startsWith(exact),
  )
  return starts[0] || ''
}
