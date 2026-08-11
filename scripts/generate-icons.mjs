import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    }
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  const crc = crc32(Buffer.concat([typeBuf, data]))
  crcBuf.writeUInt32BE(crc, 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = paint(x, y, size)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function clockIcon(x, y, size) {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.hypot(dx, dy)
  const r = size * 0.38
  const stroke = size * 0.045

  // background
  if (dist > r + stroke) return [0, 0, 0, 255]

  // face ring
  if (Math.abs(dist - r) < stroke) return [245, 245, 245, 255]

  // hour hand (~10:10)
  const hourLen = r * 0.45
  const hourAngle = (-60 * Math.PI) / 180
  const hx = Math.sin(hourAngle)
  const hy = -Math.cos(hourAngle)
  const hourProj = dx * hx + dy * hy
  const hourDist = Math.abs(dx * hy - dy * hx)
  if (hourProj >= 0 && hourProj <= hourLen && hourDist < stroke * 0.9) {
    return [245, 245, 245, 255]
  }

  // minute hand
  const minLen = r * 0.7
  const minAngle = (60 * Math.PI) / 180
  const mx = Math.sin(minAngle)
  const my = -Math.cos(minAngle)
  const minProj = dx * mx + dy * my
  const minDist = Math.abs(dx * my - dy * mx)
  if (minProj >= 0 && minProj <= minLen && minDist < stroke * 0.7) {
    return [200, 200, 200, 255]
  }

  // center pivot
  if (dist < stroke * 1.1) return [163, 163, 163, 255]

  return [0, 0, 0, 255]
}

for (const size of [180, 192, 512]) {
  const name =
    size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  writeFileSync(join(outDir, name), png(size, clockIcon))
}

console.log('Icons written to', outDir)
