import { lazy, Suspense, useCallback, useState } from 'react'
import QuestionOverlay from './components/QuestionOverlay'
import SceneBoundary from './scene/SceneBoundary'
import SceneFallback from './scene/SceneFallback'
import { firstQuestion, nextQuestion } from './questions'
import './styles.css'

const HyggeWorld = lazy(() => import('./scene/HyggeWorld'))

function webglAvailable() {
  if (typeof document === 'undefined') return false
  try {
    // The installed Three renderer requires WebGL 2. Release this disposable
    // probe instead of holding a second GPU context for the life of the page.
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [question, setQuestion] = useState(firstQuestion)
  const [available] = useState(webglAvailable)
  const [sceneFailed, setSceneFailed] = useState(false)
  const failScene = useCallback(() => setSceneFailed(true), [])
  const advanceQuestion = () => setQuestion((current) => nextQuestion(current))

  return (
    <main className="app-shell">
      <QuestionOverlay question={question} onAdvance={advanceQuestion} />
      <div className="world-panel">
        <div className="world-canvas" aria-hidden="true">
          {!available || sceneFailed ? <SceneFallback /> : (
            <SceneBoundary>
              <Suspense fallback={<SceneFallback />}>
                <HyggeWorld onFailure={failScene} />
              </Suspense>
            </SceneBoundary>
          )}
        </div>
        <div className="world-caption" aria-hidden="true">
          <span className="location-dot" />
          <span>The quiet corner</span>
          <span className="caption-divider" />
          <span>A place to pause</span>
        </div>
        <span className="world-edition" aria-hidden="true">01 / AT HOME</span>
      </div>
    </main>
  )
}
