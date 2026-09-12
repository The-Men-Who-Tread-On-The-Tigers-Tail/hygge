import { useState } from 'react'
import { firstQuestion, nextQuestion } from './questions'
import './styles.css'

export default function App() {
  const [question, setQuestion] = useState(firstQuestion)

  return (
    <main className="app-shell">
      <section className="question-card" aria-labelledby="app-title">
        <p className="eyebrow">A moment for yourself</p>
        <h1 id="app-title">Hygge</h1>
        <p className="intro">Slow down and notice what makes today feel good.</p>
        <div className="question-panel">
          <p className="question-label">Reflect on this</p>
          <h2>{question}</h2>
        </div>
        <button type="button" onClick={() => setQuestion(nextQuestion(question))}>
          Another question
        </button>
      </section>
    </main>
  )
}
