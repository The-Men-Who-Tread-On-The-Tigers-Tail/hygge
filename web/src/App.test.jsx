import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import '@testing-library/jest-dom/vitest'

// Mock the GPU boundary, not Three primitives into the DOM. Actual geometry,
// lighting and camera framing are checked in a real browser, not jsdom.
const renderer = vi.hoisted(() => ({ fail: null, throwOnMount: false }))
vi.mock('./scene/HyggeWorld', () => ({
  default: ({ onFailure, advanceSequence, reducedMotion }) => {
    if (renderer.throwOnMount) throw new Error('Renderer initialization failed')
    renderer.fail = onFailure
    return <div data-testid="webgl-canvas" data-sequence={advanceSequence} data-reduced-motion={String(reducedMotion)} />
  },
}))

function setReducedMotion(reduced) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

beforeEach(() => {
  renderer.fail = null
  renderer.throwOnMount = false
  setReducedMotion(false)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ getExtension: vi.fn() })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const question = () => screen.getByRole('heading', { level: 2 })
const advance = () => screen.getByRole('button', { name: /another question/i })

async function renderWorld() {
  render(<App />)
  await screen.findByTestId('webgl-canvas')
}

describe('Hygge reading experience', () => {
  it('advances the question with the single primary action', async () => {
    const user = userEvent.setup()
    await renderWorld()
    expect(question()).toHaveTextContent('What small part of today felt most like home?')
    await user.click(advance())
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('keeps Another question focused and activatable with Enter', async () => {
    const user = userEvent.setup()
    await renderWorld()
    advance().focus()
    await user.keyboard('{Enter}')
    expect(advance()).toHaveFocus()
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
  })

  it('requests a new deal on every question, including wrapped and rapid advances', async () => {
    render(<App />)
    const room = await screen.findByTestId('webgl-canvas')
    expect(room).toHaveAttribute('data-sequence', '0')
    expect(room).toHaveAttribute('data-reduced-motion', 'false')
    const button = screen.getByRole('button', { name: /Another question/i })
    act(() => { for (let i = 0; i < 10; i += 1) button.click() })
    expect(room).toHaveAttribute('data-sequence', '10')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What small part of today made the room feel warmer?')
  })

  it('passes reduced motion through to the real scene without removing it', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'), media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }))
    render(<App />)
    const room = await screen.findByTestId('webgl-canvas')
    expect(room).toHaveAttribute('data-reduced-motion', 'true')
    act(() => advance().click())
    expect(room).toHaveAttribute('data-sequence', '1')
  })

  it('announces the question itself and preserves focus after Space activation', async () => {
    const user = userEvent.setup()
    await renderWorld()
    advance().focus()
    await user.keyboard(' ')
    expect(advance()).toHaveFocus()
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
    expect(question().closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('cycles through the existing questions without dropping rapid activations', async () => {
    await renderWorld()
    act(() => { for (let i = 0; i < 9; i += 1) advance().click() })
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
  })

  it('keeps the stationary room visible for reduced motion', async () => {
    setReducedMotion(true)
    await renderWorld()
    expect(screen.queryByTestId('scene-fallback')).not.toBeInTheDocument()
  })

  it('keeps reading and advancement available without WebGL', async () => {
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null)
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByTestId('scene-fallback')).toBeVisible()
    expect(screen.queryByTestId('webgl-canvas')).not.toBeInTheDocument()
    await user.click(advance())
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
  })

  it('keeps the UI available when renderer initialization throws', async () => {
    renderer.throwOnMount = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByTestId('scene-fallback')).toBeVisible()
    await user.click(advance())
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
  })

  it('retains the question and focus if the renderer fails after advancement', async () => {
    const user = userEvent.setup()
    await renderWorld()
    await user.click(advance())
    act(() => renderer.fail())
    expect(screen.getByTestId('scene-fallback')).toBeVisible()
    expect(question()).toHaveTextContent('What small part of today helped you breathe more slowly?')
    expect(advance()).toHaveFocus()
    await user.click(advance())
    expect(question()).toHaveTextContent('What small part of today made the room feel warmer?')
    expect(screen.queryByTestId('webgl-canvas')).not.toBeInTheDocument()
  })

  it('probes WebGL 2 once rather than on every question update and releases the probe', async () => {
    const loseContext = vi.fn()
    HTMLCanvasElement.prototype.getContext.mockReturnValue({ getExtension: () => ({ loseContext }) })
    const user = userEvent.setup()
    await renderWorld()
    await user.click(advance())
    await user.click(advance())
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledExactlyOnceWith('webgl2')
    expect(loseContext).toHaveBeenCalledTimes(1)
  })
})
