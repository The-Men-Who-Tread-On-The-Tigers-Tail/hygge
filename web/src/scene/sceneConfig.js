export const palette = {
  background: '#ede7db', plaster: '#eee6d6', sideWall: '#dedecb',
  trim: '#faf1df', oak: '#b88c5d', oakLight: '#d4b181', oakDark: '#876445',
  sage: '#839681', darkGreen: '#425f49', leaf: '#789460',
  ceramic: '#f3e4c8', terracotta: '#bc795b', rug: '#c9c0a3', brass: '#a88749',
}

export const room = { width: 6.4, depth: 16, height: 12, back: -2.9, right: 12 }
export const windowOpening = { left: -1.45, right: 1.75, bottom: 1.35, top: 3.45 }
export const placement = {
  table: [0.15, 0, 0.05], chair: [-1.5, 0, 1.4],
  lamp: [2.3, 0, -1.45], plant: [-2.3, 0, -1.75],
}
export const cameraConfig = {
  fov: 43, target: [0, 1.55, -0.35], direction: [0.37, 0.27, 0.89],
  bounds: { min: [-3.25, -0.12, -2.95], max: [3.25, 4.05, 2.65] },
}
export const daylight = { position: [0.5, 7, -5.5], intensity: 3.1 }
