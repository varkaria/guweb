import {
    compiledFileNameSchema,
    compiledFileSchema,
    path as translationPath,
    divider,
    contextToFileName
} from './config.mjs'
import yaml from 'js-yaml'
import { join } from 'path'
import fs from 'fs/promises'
import _path from 'path'
import { existsSync, mkdirSync } from 'fs'

export function formatLocaleData(locale, context) {
    const current = locale[context.locale][context.namespace]
    return yaml.dump(current)
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
            const fileName = contextToFileName(context)
            const yaml = formatLocaleData(locales, context)
            const path = join(translationPath, fileName)
            const dir = _path.dirname(path)
            if (!existsSync(path)) {
                mkdirSync(dir, {recursive: true})
            }
            fs.writeFile(path, yaml, 'utf8')
        }
    }
}
