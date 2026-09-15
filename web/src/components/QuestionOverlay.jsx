export default function QuestionOverlay({ question, onAdvance }) {
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
          <h2>{question}</h2>
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
