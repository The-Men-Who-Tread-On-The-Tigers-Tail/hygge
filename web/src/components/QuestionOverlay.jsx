import { useLayoutEffect, useRef } from 'react'

export default function QuestionOverlay({ question, onAdvance, reducedMotion = false }) {
  const heading = useRef(null)
  const previousQuestion = useRef(question)

  useLayoutEffect(() => {
    const changed = previousQuestion.current !== question
    previousQuestion.current = question
    if (!changed || reducedMotion || !heading.current?.animate) return undefined
    const transition = heading.current.animate([
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    return () => transition.cancel()
  }, [question, reducedMotion])

  return (
    <section className="reading-panel" aria-labelledby="app-title">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">h.</span>
        <h1 id="app-title">Hygge</h1>
      </header>
      <div className="reading-content">
        <p className="intro">A little room to breathe.</p>
        <div className="question-panel" aria-live="polite" aria-atomic="true">
          <p className="question-label">Take a moment</p>
          <h2 ref={heading}>{question}</h2>
        </div>
        <button type="button" onClick={onAdvance}>
          Another question <span aria-hidden="true">↗</span>
        </button>
        <p className="reading-note">No right answers. No hurry.</p>
      </div>
      <footer className="reading-footer"><span aria-hidden="true">✳</span> Make yourself at home.</footer>
    </section>
  )
}
