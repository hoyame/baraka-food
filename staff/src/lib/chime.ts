let ctx: AudioContext | null = null

export function unlockAudio() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx.state !== 'suspended'
}

function note(ctx: AudioContext, out: AudioNode, freq: number, start: number, duration: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq

  const harm = ctx.createOscillator()
  const harmGain = ctx.createGain()
  harm.type = 'square'
  harm.frequency.value = freq * 2
  harmGain.gain.value = 0.22

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  harm.connect(harmGain)
  harmGain.connect(gain)
  gain.connect(out)

  osc.start(start)
  harm.start(start)
  osc.stop(start + duration + 0.05)
  harm.stop(start + duration + 0.05)
}

export function playNewOrderChime() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') return

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -14
  compressor.knee.value = 8
  compressor.ratio.value = 12
  compressor.attack.value = 0.002
  compressor.release.value = 0.2

  const master = ctx.createGain()
  master.gain.value = 5
  master.connect(compressor)
  compressor.connect(ctx.destination)

  const t = ctx.currentTime + 0.02
  const melodie: [number, number][] = [
    [659.25, 0],
    [880, 0.16],
    [1174.66, 0.32],
  ]
  for (const [freq, offset] of melodie) note(ctx, master, freq, t + offset, 0.6, 0.9)
  for (const [freq, offset] of melodie) note(ctx, master, freq, t + 0.85 + offset, 0.6, 0.9)
}
