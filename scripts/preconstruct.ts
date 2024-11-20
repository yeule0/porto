import { mkdir, readFile, readdir, rm, symlink } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

// Symlinks package sources to dist for local development

console.log('Setting up packages for development.')

const packagePath = resolve(import.meta.dirname, '../src/package.json')
type Package = {
  bin?: Record<string, string> | undefined
  exports: Record<string, { types: string; default: string } | string>
  name?: string | undefined
  private?: boolean | undefined
}
const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as Package

console.log(`${packageJson.name} — ${dirname(packagePath)}`)

const dir = resolve(dirname(packagePath))

// Empty dist directories
const distDirName = '_dist'
const dist = resolve(dir, distDirName)
let files: string[] = []
try {
  files = await readdir(dist)
} catch {
  await mkdir(dist)
}

const promises = []
for (const file of files) {
  promises.push(rm(join(dist, file), { recursive: true, force: true }))
}
await Promise.all(promises)

// Link exports to dist locations
for (const [key, exports] of Object.entries(packageJson.exports)) {
  // Skip `package.json` exports
  if (/package\.json$/.test(key)) continue
  if (typeof exports === 'string') continue

  // Link exports to dist locations
  for (const [_, value] of Object.entries(exports) as [
    type: 'types' | 'default',
    value: string,
  ][]) {
    const srcDir = resolve(dir, dirname(value).replace(distDirName, ''))
    let srcFileName: string
    if (key === '.') srcFileName = 'index.ts'
    else {
      srcFileName = basename(`${key}.ts`)
    }
    const srcFilePath = resolve(srcDir, srcFileName)

    const distDir = resolve(dir, dirname(value))
    const distFileName = basename(value)
    const distFilePath = resolve(distDir, distFileName)

    await mkdir(distDir, { recursive: true })

    // Symlink src to dist file
    await symlink(srcFilePath, distFilePath, 'file')
  }
}

console.log('Done. Set up packages.')
