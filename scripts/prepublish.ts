import { join, relative, resolve } from 'node:path'
import fs from 'fs-extra'
import { getExports } from './utils/exports.js'

const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageJson = fs.readJsonSync(packageJsonPath)

const exports = getExports({
  onEntry: ({ entryName, name, parentEntryName }) => {
    const distBasePath = (type: string) =>
      parentEntryName
        ? `./${type}/${parentEntryName}/${name}`
        : `./${type}/${name}`

    try {
      fs.mkdirSync(resolve(import.meta.dirname, '../src', entryName))
    } catch {}
    fs.writeJsonSync(
      resolve(import.meta.dirname, '../src', entryName, 'package.json'),
      {
        type: 'module',
        types: relative(
          resolve(import.meta.dirname, '../src'),
          `${distBasePath('_dist')}.d.ts`,
        ),
        main: relative(
          resolve(import.meta.dirname, '../src'),
          `${distBasePath('_dist')}.js`,
        ),
      },
      { spaces: 2 },
    )
  },
})

packageJson.exports = exports.dist

delete packageJson.type

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
