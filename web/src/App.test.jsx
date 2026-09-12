import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

import '@testing-library/jest-dom/vitest'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => {
    if (window.__hyggeCanvasError) throw new Error('WebGL initialization failed')
    return <div data-testid="webgl-canvas">{children}</div>
  },
  useFrame: () => {},
  useThree: () => ({ camera: { position: { x: 0, y: 0 }, rotation: { z: 0 } } }),
}))

function setReducedMotion(reduced) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('Hygge web interface', () => {
  beforeEach(() => {
    cleanup()
    window.__hyggeCanvasError = false
    setReducedMotion(false)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ getExtension: vi.fn() }))
  })

  it('advances the displayed question when Another question is activated', async () => {
    const user = userEvent.setup()
    render(<App />)
    const firstQuestion = screen.getByRole('heading', { level: 2 }).textContent
    await user.click(screen.getByRole('button', { name: /another question/i }))
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveTextContent(firstQuestion)
  })

  it('keeps Another question keyboard-focusable and activatable', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /another question/i })
    const firstQuestion = screen.getByRole('heading', { level: 2 }).textContent
    button.focus()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveTextContent(firstQuestion)
  })

  it('renders the static fallback without an animated canvas for reduced motion', () => {
    setReducedMotion(true)
    render(<App />)
    expect(screen.getByTestId('scene-fallback')).toBeVisible()
    expect(screen.queryByTestId('ambient-scene')).not.toBeInTheDocument()
  })

  it('renders the static fallback when WebGL is unavailable', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null)
    render(<App />)
    expect(screen.getByTestId('scene-fallback')).toBeVisible()
    expect(screen.queryByTestId('ambient-scene')).not.toBeInTheDocument()
  })

  it('renders the static fallback when WebGL initialization fails', () => {
    window.__hyggeCanvasError = true
    render(<App />)
    expect(screen.getByTestId('scene-fallback')).toBeVisible()
    expect(screen.queryByTestId('webgl-canvas')).not.toBeInTheDocument()
  })

  it('cycles the scene effect when Another question is activated', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /another question/i })
    expect(screen.getByText(/next question will bring the scene to life/i)).toBeVisible()
    await user.click(button)
    expect(screen.getByText(/green stone pulse/i)).toBeVisible()
    await user.click(button)
    expect(screen.getByText(/warm ring motion/i)).toBeVisible()
    expect(screen.queryByRole('button', { name: /wake the stone/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /turn the ring/i })).not.toBeInTheDocument()
  })
})
