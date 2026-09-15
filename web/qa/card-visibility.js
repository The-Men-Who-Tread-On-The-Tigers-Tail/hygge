async (page) => {
  const sizes = [
    [1440, 900], [1280, 720], [1024, 600], [900, 500], [844, 390],
    [768, 1024], [600, 600], [390, 844], [375, 667], [360, 640], [320, 568],
    [320, 480], [500, 500], [600, 450], [1200, 400],
    [421, 500], [450, 500], [600, 500], [601, 500], [420, 501],
  ]
  const results = []
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:5178/')
    await page.locator('canvas[data-scene-ready="true"]').waitFor()
    await page.mouse.move(1, 1)
    const result = await page.evaluate(async () => {
      const resources = performance.getEntriesByType('resource').map((entry) => entry.name)
      const { _roots } = await import(resources.find((name) => name.includes('/@react-three_fiber.js')))
      const { Raycaster, Vector2 } = await import(resources.find((name) => name.includes('/three.js')))
      const canvas = document.querySelector('canvas')
      const { camera, scene } = _roots.get(canvas).store.getState()
      const card = scene.getObjectByName('dealt-card')
      const ray = new Raycaster()
      let fits = true
      let unobstructed = true
      let samples = 0
      let maximumTravelPx = 0
      let initial
      const started = performance.now()
      let nextClick = 0
      return await new Promise((resolve) => {
        function frame(now) {
          scene.updateMatrixWorld(true)
          camera.updateMatrixWorld(true)
          const rect = canvas.getBoundingClientRect()
          card.traverse((mesh) => {
            if (!mesh.isMesh) return
            mesh.geometry.computeBoundingBox()
            const { min, max } = mesh.geometry.boundingBox
            for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
              const point = card.position.clone().set(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera)
              fits &&= Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && point.z >= -1 && point.z <= 1
            }
          })
          const center = card.getWorldPosition(card.position.clone()).project(camera)
          if (!initial) initial = center.clone()
          maximumTravelPx = Math.max(maximumTravelPx, Math.hypot((center.x - initial.x) * rect.width / 2, (center.y - initial.y) * rect.height / 2))
          ray.setFromCamera(new Vector2(center.x, center.y), camera)
          const hit = ray.intersectObjects(scene.children, true)[0]
          let object = hit?.object
          while (object && object !== card) object = object.parent
          unobstructed &&= object === card
          samples += 1
          const elapsed = now - started
          if (elapsed >= nextClick && nextClick <= 450) {
            document.querySelector('button').click()
            nextClick += 150
          }
          if (elapsed < 1750) requestAnimationFrame(frame)
          else resolve({ fits, unobstructed, maximumTravelPx, samples })
        }
        requestAnimationFrame(frame)
      })
    })
    results.push({ width, height, ...result })
  }
  const failures = results.filter((result) => !result.fits || !result.unobstructed || result.maximumTravelPx < 2 || result.samples < 10)
  if (failures.length) throw new Error(JSON.stringify(failures))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5178/')
  return { passedViewports: results.length, results }
}
