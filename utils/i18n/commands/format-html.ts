/* eslint-disable @typescript-eslint/no-misused-promises */
import glob from 'glob'
import path from 'path'
import fs from 'fs/promises'
import clui from 'clui'

import { rootPath } from '../config'

const parallel = (process.env.PARALLEL != null) || false
const { Spinner } = clui

const doWork = async (match: string): Promise<void> => {
  try {
    let template = await fs.readFile(match, { encoding: 'utf8' })
    template = template.replace(/\{\{\s?t\('(.*)'\s?(,\s?(.+)\s?)?\)\s?\}\}/gmu, '{{ t(\'$1\'$2) }}')
    template = template.replace(/\{\{\s?t\("(.*)"\s?(,\s?(.+)\s?)?\)\s?\}\}/gmu, '{{ t("$1"$2) }}')
    await fs.writeFile(match, template, 'utf8')
  } catch (error) {
    console.error(error)
  }
}

glob(path.join(rootPath, 'templates/**/*.html'), async (err, matches) => {
  if (err != null) throw err
  const work = new Spinner('formatting templates...')
  work.start()
  if (parallel) {
    await Promise.all(matches.map(async match => {
      const work = new Spinner(`formatting template: ${match}`)
      work.start()
      await doWork(match)
      work.stop()
    }))
  } else {
    for (const match of matches) {
      work.message(`formatting template: ${match}`)
      await doWork(match)
    }
  }
  work.stop()
  console.log('formatting templates...  done')
})
