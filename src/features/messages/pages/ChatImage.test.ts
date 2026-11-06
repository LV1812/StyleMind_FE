import { afterEach, expect, it, vi } from 'vitest'
import { validateImages } from './ChatImage'
afterEach(() => vi.unstubAllGlobals())
it('enforces image count, file type, size and decoded pixel limits', async () => {
  const valid = new File(['x'], 'x.png', { type: 'image/png' })
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 8000, height: 5000, close() {} })))
  expect(await validateImages([valid])).toBeNull()
  expect(await validateImages(Array(6).fill(valid))).toMatch(/5 ảnh/)
  expect(await validateImages([new File(['x'], 'x.txt', { type: 'text/plain' })])).toMatch(/JPEG/)
  expect(await validateImages([new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' })])).toMatch(/5 MB/)
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 8001, height: 5000, close() {} })))
  expect(await validateImages([valid])).toMatch(/40 megapixel/)
})
