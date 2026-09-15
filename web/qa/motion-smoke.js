async (page) => {
  const baseURL = 'http://127.0.0.1:5178/'
  const checks = []
  const errors = []
  const collectError = (error) => errors.push(error.message)
  const check = (condition, label) => {
    if (!condition) throw new Error(label)
    checks.push(label)
  }
  // Inspect the real rendered scene, not mocked DOM primitives or app test flags.
  // This inspection intentionally targets the Vite development server.
  const sample = (target) => target.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => name.includes('/@react-three_fiber.js'))
    const { _roots } = await import(url)
    const { camera, scene, gl } = _roots.get(document.querySelector('canvas')).store.getState()
    const card = scene.getObjectByName('dealt-card')
    return { camera: camera.position.toArray(), card: card.position.toArray(), rotation: card.rotation.toArray().slice(0, 3), frames: gl.info.render.frame }
  })
  const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]))
  const resting = (state) => distance(state.card, [0, 0.045, 0]) < 0.0001 && distance(state.rotation, [0, 0, 0]) < 0.0001
  const ready = async (target) => {
    await target.locator('canvas[data-scene-ready="true"]').waitFor({ state: 'visible' })
    await target.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  page.on('pageerror', collectError)
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(baseURL)
    await ready(page)
    await page.mouse.move(10, 10)
    await page.waitForTimeout(1600)
    const initial = await sample(page)
    await page.waitForTimeout(250)
    check((await sample(page)).frames === initial.frames, 'renderer stops when the room is idle')
    check(resting(initial), 'card initially rests on the table without an entrance animation')

    const world = await page.locator('.world-canvas').boundingBox()
    await page.mouse.move(world.x + world.width * 0.9, world.y + world.height * 0.2)
    await page.waitForTimeout(350)
    const shifted = await sample(page)
    const shift = distance(initial.camera, shifted.camera)
    check(shift > 0.03 && shift < 0.3, 'pointer produces a perceptible but bounded camera shift')
    await page.mouse.move(10, 10)
    await page.waitForTimeout(1600)
    check(distance(initial.camera, (await sample(page)).camera) < 0.001, 'camera recenters after leaving the room')

    const button = page.getByRole('button', { name: 'Another question' })
    await button.click()
    check(await page.getByRole('heading', { level: 2 }).textContent() === 'What small part of today helped you breathe more slowly?', 'question changes immediately rather than waiting for the deal')
    await page.waitForTimeout(220)
    const dealing = await sample(page)
    check(dealing.card[1] > 0.15 && Math.abs(dealing.rotation[0]) > 0.1, 'a real 3D card lifts and turns after an idle period')
    await button.evaluate((element) => { for (let i = 0; i < 9; i += 1) element.click() })
    check(await page.getByRole('heading', { level: 2 }).textContent() === 'What small part of today made the room feel warmer?', 'rapid activations retain every question advance across a full cycle')
    for (let i = 0; i < 8; i += 1) {
      await button.evaluate((element) => element.click())
      await page.waitForTimeout(90)
      check((await sample(page)).card[1] < 0.8, `mid-flight restart ${i + 1} stays within the bounded deal path`)
    }
    await page.waitForTimeout(1300)
    check(resting(await sample(page)), 'rapidly restarted deal settles cleanly back onto the deck')
    const settled = await sample(page)
    await page.waitForTimeout(250)
    check((await sample(page)).frames === settled.frames, 'renderer stops again after the animation')
    check(await button.evaluate((element) => element === document.activeElement), 'deal preserves keyboard focus')
    check(await page.locator('h2').evaluate((element) => {
      const style = getComputedStyle(element)
      return style.transform === 'none' && style.animationName === 'none'
    }), 'HTML question text has no transform or animation')

    await button.press('Space')
    await page.waitForTimeout(140)
    check(!resting(await sample(page)), 'keyboard activation also deals a card')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(100)
    const reduced = await sample(page)
    check(resting(reduced), 'enabling reduced motion cancels an active deal immediately')
    await page.mouse.move(world.x + world.width * 0.9, world.y + world.height * 0.2)
    await button.press('Enter')
    await page.waitForTimeout(150)
    const reducedAfter = await sample(page)
    check(resting(reducedAfter) && distance(reduced.camera, reducedAfter.camera) < 0.0001, 'reduced motion disables both camera parallax and card animation')
    check(await page.locator('canvas').count() === 1, 'reduced motion retains the real furnished room')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await button.press('Enter')
    await page.waitForTimeout(200)
    check(!resting(await sample(page)), 'turning reduced motion off restores dealing without reloading')

    const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    try {
      const mobile = await context.newPage()
      mobile.on('pageerror', collectError)
      await mobile.goto(baseURL)
      await ready(mobile)
      const beforeTouch = await sample(mobile)
      const mobileWorld = await mobile.locator('.world-canvas').boundingBox()
      await mobile.touchscreen.tap(mobileWorld.x + mobileWorld.width * 0.8, mobileWorld.y + mobileWorld.height * 0.3)
      await mobile.waitForTimeout(250)
      check(distance(beforeTouch.camera, (await sample(mobile)).camera) < 0.0001, 'touching the room does not move or drag the camera')
      await mobile.getByRole('button', { name: 'Another question' }).tap()
      await mobile.waitForTimeout(200)
      check(!resting(await sample(mobile)), 'touch activation produces the same visible card deal')
    } finally { await context.close() }
    await page.mouse.move(10, 10)
    await page.waitForTimeout(1300)
    check(errors.length === 0, `no uncaught page errors: ${errors.join('; ')}`)
    return { browser: await page.context().browser().version(), passed: checks.length, checks, errors }
  } finally { page.off('pageerror', collectError) }
}
