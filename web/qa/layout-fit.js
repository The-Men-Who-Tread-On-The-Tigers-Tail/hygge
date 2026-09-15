async (page) => {
  await page.goto('http://127.0.0.1:5178/')
  const sizes = [
    [1440, 900], [1280, 720], [1024, 600], [900, 500], [844, 390],
    [768, 1024], [600, 600], [390, 844], [375, 667], [360, 640], [320, 568],
    [320, 480], [500, 500], [600, 450], [1200, 400],
  ]
  const results = []
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height })
    let maximumOverflow = 0
    let controlsInView = true
    let contentUnclipped = true
    for (let i = 0; i < 8; i += 1) {
      const measured = await page.evaluate(() => {
        const root = document.documentElement
        const question = document.querySelector('h2').getBoundingClientRect()
        const button = document.querySelector('button').getBoundingClientRect()
        const panel = document.querySelector('.reading-panel').getBoundingClientRect()
        const scene = document.querySelector('.world-panel').getBoundingClientRect()
        return {
          overflow: Math.max(root.scrollHeight - innerHeight, root.scrollWidth - innerWidth),
          visible: question.top >= 0 && button.bottom <= innerHeight + 1 && panel.bottom <= innerHeight + 1 && scene.height >= 100,
          unclipped: ['main', '.reading-panel', '.reading-content'].every((selector) => !['hidden', 'clip'].includes(getComputedStyle(document.querySelector(selector)).overflowY)),
        }
      })
      maximumOverflow = Math.max(maximumOverflow, measured.overflow)
      controlsInView &&= measured.visible
      contentUnclipped &&= measured.unclipped
      await page.getByRole('button', { name: 'Another question' }).click()
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    results.push({ width, height, maximumOverflow, controlsInView, contentUnclipped })
  }
  const font = await page.locator('h2').evaluate((element) => getComputedStyle(element).fontFamily)
  const failures = results.filter((result) => result.maximumOverflow > 1 || !result.controlsInView || !result.contentUnclipped)
  if (failures.length || /Georgia|Times New Roman/.test(font)) {
    throw new Error(JSON.stringify({ failures, font }))
  }
  return { passedViewports: results.length, questionsPerViewport: 8, font, results }
}
