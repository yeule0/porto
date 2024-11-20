import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

// Generates proxy packages for package.json#exports.

console.log('Generating proxy packages.')

const packagePath = resolve(import.meta.dirname, '../src/package.json')
type Package = Record<string, unknown> & {
  name?: string | undefined
  private?: boolean | undefined
  exports: Record<string, { types: string; default: string } | string>
}
const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as Package

console.log(`${packageJson.name} — ${dirname(packagePath)}`)

const dir = resolve(dirname(packagePath))

for (const [key, exports] of Object.entries(packageJson.exports)) {
  // Skip `package.json` export
  if (/package\.json$/.test(key)) continue
  if (key === '.') continue
  if (typeof exports === 'string') continue
  if (!exports.default) continue

  const proxyDir = resolve(dir, key)
  await mkdir(proxyDir, { recursive: true })

  const types = relative(key, exports.types)
  const main = relative(key, exports.default)
  await writeFile(
    `${proxyDir}/package.json`,
    `${JSON.stringify({ type: 'module', types, main }, undefined, 2)}\n`,
  )
}

console.log('Done. Generated proxy packages.')
