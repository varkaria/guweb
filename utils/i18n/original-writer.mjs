import { compiledFileNameSchema, compiledFileSchema, compiled as translationPath, divider } from './config.mjs'
import yaml from 'js-yaml'
import { join, dirname } from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

export function formatLocaleData(locale, context) {
    const current = locale[context.locale][context.namespace]
    // transform schema
    let write = {}
    const path = []
    compiledFileSchema.forEach(k => {
        switch (k) {
            case 'locale': {
                write = {
                    [context.locale.replace('-','_')]: write
                }
                path.push(context.locale.replace('-','_'))
                break
            }
            case 'entries': {
                const readonly = [...path]
                const last = readonly.pop()
                const target = readonly.reduce((acc, cur) => {
                    return acc[cur]
                }, write)
                target[last] = current
            }
        }
    })

    return yaml.dump(write)
}

export function generateFileName(context) {
    return compiledFileNameSchema.map(k => context[k].replace('-','_')).join(divider)
}

export function writeToDisk(locales) {
    for (const locale in locales) {
        const namespaces = locales[locale]
        for (const namespace in namespaces) {
            const entries = namespaces[namespace]
            const context = {
                locale,
                namespace,
                extension: 'yml'
            }
            const fileName = generateFileName(context)
            const yaml = formatLocaleData(locales, context)
            const path = join(translationPath, fileName)
            const dir = dirname(path)
            if (!existsSync(path)) {
                mkdirSync(dir, {recursive: true})
            }
            fs.writeFile(path, yaml, 'utf8')
        }
    }
}
