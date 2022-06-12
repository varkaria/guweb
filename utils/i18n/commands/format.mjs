import yaml from 'js-yaml'

import glob from 'glob'
import path from 'path'
import fs from 'fs/promises'
import clui from 'clui'
const { Spinner } = clui

import { path as translationPath } from '../config.mjs'


glob(path.join(translationPath, '**/*.yml'), async (err, matches) => {
    if (err) throw err
    const work = new Spinner(`formatting locales...`)
    work.start()
    await Promise.all(matches.map(async (match) => {
        const work = new Spinner(`formatting locale: ${match}`)
        work.start()
        try {
            const data = yaml.load(await fs.readFile(match, { encoding: 'utf8' }))
            const formatted = yaml.dump(data)
            await fs.writeFile(match, formatted, 'utf8')
        } catch (error) {
            console.error(error)
        } finally {
            work.stop()
        }
    }))
    work.stop()
    console.log(`formatting locales...  done`)
})

glob(path.join(translationPath, '../templates/**/*.html'), async (err, matches) => {
    if (err) throw err
    const work = new Spinner(`formatting templates...`)
    work.start()
    await Promise.all(matches.map(async match => {
        const work = new Spinner(`formatting locale: ${match}`)
        work.start()
        try {
            const template = await fs.readFile(match, { encoding: 'utf8' })
            const wb = template.replace(/\{\{\s?t\('(.*)'\s?(,\s?(.+)\s?)?\)\s?\}\}/gmu, '{{ t(\'$1\'$2) }}')
            await fs.writeFile(match, wb, 'utf8')
        } catch (error) {
            console.error(error)
        } finally {
            work.stop()
        }
    }))
    work.stop()
    console.log(`formatting templates...  done`)
})