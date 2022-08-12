const parallel = process.env.PARALLEL || false

import glob from 'glob'
import path from 'path'
import fs from 'fs/promises'
import clui from 'clui'
const { Spinner } = clui

import { path as translationPath } from '../config.js'

const doWork = async (match) => {
    try {
        const template = await fs.readFile(match, { encoding: 'utf8' })
        const wb = template.replace(/\{\{\s?t\('(.*)'\s?(,\s?(.+)\s?)?\)\s?\}\}/gmu, '{{ t(\'$1\'$2) }}')
        await fs.writeFile(match, wb, 'utf8')
    } catch (error) {
        console.error(error)
    }
}

glob(path.join(translationPath, '../templates/**/*.html'), async (err, matches) => {
    if (err) throw err
    const work = new Spinner(`formatting templates...`)
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
    console.log(`formatting templates...  done`)
})