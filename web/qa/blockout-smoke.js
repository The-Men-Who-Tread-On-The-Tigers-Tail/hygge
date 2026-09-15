async (page) => {
  const baseURL = 'http://127.0.0.1:5178/'
  const results = []
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const check = (condition, label) => {
    if (!condition) throw new Error(label)
    results.push(label)
  }
  await page.goto(baseURL)
  await page.locator('canvas').waitFor({ state: 'visible' })
  const question = page.getByRole('heading', { level: 2 })
  const button = page.getByRole('button', { name: 'Another question' })
  check(await page.getByRole('button').count() === 1, 'one primary action')
  await button.click()
  check(await question.textContent() === 'What small part of today helped you breathe more slowly?', 'mouse advances question')
  await button.press('Space')
  check(await question.textContent() === 'What small part of today made the room feel warmer?', 'Space advances question')
  await button.press('Enter')
  check(await question.textContent() === 'What small part of today invited you to linger a little longer?', 'Enter advances question')
  check(await button.evaluate((element) => element === document.activeElement), 'keyboard focus retained')

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport)
    const layout = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
      canvasWidth: document.querySelector('canvas').getBoundingClientRect().width,
      canvasHeight: document.querySelector('canvas').getBoundingClientRect().height,
    }))
    check(layout.contentWidth <= layout.width, `no horizontal overflow at ${viewport.width}px`)
    check(layout.canvasWidth > 0 && layout.canvasHeight > 0, `room visible at ${viewport.width}px`)
    await button.scrollIntoViewIfNeeded()
    check(await button.isVisible(), `button reachable at ${viewport.width}px`)
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  check(await page.locator('canvas').count() === 1, 'static world retained with reduced motion')
  await button.click()
  check(await question.textContent() === 'What small part of today deserves more gratitude than it usually gets?', 'reduced-motion question advancement')

  const beforeLoss = await question.textContent()
  const canLoseContext = await page.evaluate(() => {
    const extension = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context')
    if (!extension) return false
    extension.loseContext()
    return true
  })
  check(canLoseContext, 'browser exposes context-loss test extension')
  await page.getByTestId('scene-fallback').waitFor({ state: 'visible' })
  check(await question.textContent() === beforeLoss, 'GPU context loss preserves current question')
  check(await button.evaluate((element) => element === document.activeElement), 'GPU context loss preserves button focus')
  await button.click()
  check(await question.textContent() === 'What small part of today would you gladly repeat tomorrow?', 'fallback remains interactive')
  check(await page.locator('canvas').count() === 0, 'failed renderer removed without retry loop')

  const browser = page.context().browser()
  const fallbackContext = await browser.newContext()
  try {
    await fallbackContext.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return kind === 'webgl2' ? null : original.call(this, kind, ...args)
      }
    })
    const fallbackPage = await fallbackContext.newPage()
    await fallbackPage.goto(baseURL)
    await fallbackPage.getByTestId('scene-fallback').waitFor({ state: 'visible' })
    await fallbackPage.getByRole('button', { name: 'Another question' }).click()
    check(await fallbackPage.getByRole('heading', { level: 2 }).textContent() === 'What small part of today helped you breathe more slowly?', 'no-WebGL fallback works on initial load')
  } finally { await fallbackContext.close() }

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  try {
    const touchPage = await touchContext.newPage()
    await touchPage.goto(baseURL)
    await touchPage.locator('canvas').waitFor({ state: 'visible' })
    await touchPage.getByRole('button', { name: 'Another question' }).tap()
    check(await touchPage.getByRole('heading', { level: 2 }).textContent() === 'What small part of today helped you breathe more slowly?', 'touch tap advances question')
  } finally { await touchContext.close() }

  check(errors.length === 0, 'no uncaught page errors')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(baseURL)
  await page.locator('canvas').waitFor({ state: 'visible' })
  return { browser: await browser.version(), passed: results.length, checks: results, errors }
}
