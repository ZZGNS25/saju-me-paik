import { readFileSync, writeFileSync } from 'fs'
import { PNG } from 'pngjs'
import GIFEncoder from 'gif-encoder-2'
import path from 'path'

const assetDir =
  'C:/Users/seung/.cursor/projects/c-Users-seung-OneDrive-Documents-2026-saju-me-paik/assets'
const out = 'public/sinnaerim.gif'
const files = [
  'gut-frame-1.png',
  'gut-frame-2.png',
  'gut-frame-3.png',
  'gut-frame-4.png',
]
const SIZE = 360

function resizeNearest(png, size) {
  const outPng = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.min(png.width - 1, Math.floor((x * png.width) / size))
      const sy = Math.min(png.height - 1, Math.floor((y * png.height) / size))
      const si = (png.width * sy + sx) << 2
      const di = (size * y + x) << 2
      outPng.data[di] = png.data[si]
      outPng.data[di + 1] = png.data[si + 1]
      outPng.data[di + 2] = png.data[si + 2]
      outPng.data[di + 3] = png.data[si + 3]
    }
  }
  return outPng
}

const encoder = new GIFEncoder(SIZE, SIZE, 'neuquant', true)
encoder.setDelay(380)
encoder.setRepeat(0)
encoder.start()

for (const file of files) {
  const buf = readFileSync(path.join(assetDir, file))
  const png = PNG.sync.read(buf)
  encoder.addFrame(resizeNearest(png, SIZE).data)
}

encoder.finish()
const data = encoder.out.getData()
writeFileSync(out, data)
console.log('wrote', out, data.length)
