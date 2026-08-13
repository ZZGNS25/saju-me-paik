export async function shareOrCopyLink({ title, text, url }) {
  try {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return { status: 'shared' }
      } catch (err) {
        if (err?.name === 'AbortError') {
          return { status: 'aborted' }
        }
        throw err
      }
    }

    await navigator.clipboard.writeText(url)
    return { status: 'copied' }
  } catch {
    try {
      await navigator.clipboard.writeText(url)
      return { status: 'copied' }
    } catch {
      return { status: 'fallback', url }
    }
  }
}
