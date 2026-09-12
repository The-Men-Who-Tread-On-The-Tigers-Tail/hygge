import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

import '@testing-library/jest-dom/vitest'

describe('Hygge web interface', () => {
  it('shows a reflective question and lets the player request another one', async () => {
    const user = userEvent.setup()
    render(<App />)

    const firstQuestion = screen.getByRole('heading', { level: 2 }).textContent
    expect(firstQuestion).toBeTruthy()
    expect(screen.getByRole('button', { name: /another question/i })).toBeVisible()

    await user.click(screen.getByRole('button', { name: /another question/i }))

    expect(screen.getByRole('heading', { level: 2 })).not.toHaveTextContent(firstQuestion)
  })
})
