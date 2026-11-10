// Recover explicit colour labels from the original imported catalog.
// Run after catalog imports: node scripts/recover-catalog-image-colors.cjs
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const sourceRoot = path.resolve(root, '../StyleMind_BE/artifacts/catalog-review/livostyle')
const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'clothing-200-cloudinary-vnd.json'), 'utf8'))
const translated = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'clothing-200-db-payload-vi.json'), 'utf8'))
const result = {}
for (const product of translated.products) {
  const original = source.find(item => item.id === product.sourceId)
  if (!original) continue
  for (const image of original.images) {
    const colors = [...new Set(original.variants.map(item => item.options?.Color).filter(Boolean))]
    const color = colors.find(color => image.alt?.toLowerCase().endsWith(` in ${color.toLowerCase()}`))
    if (!color) continue // Never infer a colour from an image's position.
    const sku = original.variants.find(item => item.options?.Color === color)?.sku
    const variant = product.variants.find(item => item.sku === `LIVO-${sku}`)
    if (variant && product.images.some(item => item.url === image.url)) result[image.url] = variant.color
  }
}
const target = path.join(root, 'src/features/product-detail/data/catalogImageColors.json')
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n')
console.log(`Recovered ${Object.keys(result).length} explicit image colour labels`)
