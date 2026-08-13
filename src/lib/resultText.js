export function normalizeResultText(text) {
  return String(text || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim()
}

export function resultParagraphs(text) {
  return normalizeResultText(text)
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n/g, ' ').trim())
    .filter(Boolean)
}

export function getLockedResultParts(text) {
  const paragraphs = resultParagraphs(text)
  return {
    visible: paragraphs.slice(0, 2),
    hidden: paragraphs.slice(2),
  }
}
