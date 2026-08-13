const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function initAnalytics() {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return
  if (window.gtag) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', MEASUREMENT_ID)
}

export function trackPageView(path) {
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('config', MEASUREMENT_ID, { page_path: path })
}
