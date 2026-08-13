export function focusField(id) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.focus()
  })
}

export function scrollToResult() {
  requestAnimationFrame(() => {
    document.getElementById('result-panel')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  })
}

export function fieldClass(showMissing, isIncomplete) {
  return showMissing && isIncomplete ? 'field is-missing' : 'field'
}
