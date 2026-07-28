import { useEffect, useState } from 'react'

// Monaco carries its own theme, so it does not inherit our tokens — left on 'vs' it
// renders a white block in the middle of a dark page. This resolves the app's current
// theme the same way the shell does and keeps the editor in step when it changes.
const MEDIA = '(prefers-color-scheme: dark)'

const resolve = () => {
  const explicit = document.documentElement.getAttribute('data-theme')
  if (explicit === 'dark' || explicit === 'light') {
    return explicit
  }
  return window.matchMedia && window.matchMedia(MEDIA).matches ? 'dark' : 'light'
}

// For class components, which cannot use the hook: resolved at render time, so an
// editor already open when the theme is toggled keeps its theme until reopened.
export function getEditorTheme () {
  return resolve() === 'dark' ? 'vs-dark' : 'vs'
}

export default function useEditorTheme () {
  const [theme, setTheme] = useState(resolve)

  useEffect(() => {
    // The toggle stamps data-theme on <html>; watch that plus the OS preference.
    const observer = new MutationObserver(() => setTheme(resolve()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const mq = window.matchMedia ? window.matchMedia(MEDIA) : null
    const onChange = () => setTheme(resolve())
    if (mq) mq.addEventListener('change', onChange)

    return () => {
      observer.disconnect()
      if (mq) mq.removeEventListener('change', onChange)
    }
  }, [])

  return theme === 'dark' ? 'vs-dark' : 'vs'
}
