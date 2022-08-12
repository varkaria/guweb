import { compiledFileNameSchema, compiledFileSchema, compiled as translationPath, divider, FileContext } from './config'
import yaml from 'js-yaml'
import { join, dirname } from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

export function formatLocaleData (locale: LocaleRoot, context: FileContext): string {
  const current = locale[context.locale][context.namespace]
  // transform schema
  let write: LocaleRoot = {}
  const path: string[] = []
  compiledFileSchema.forEach(k => {
    switch (k) {
      case 'locale': {
        write = {
          [context.locale.replace('-', '_')]: write
        }
        path.push(context.locale.replace('-', '_'))
        break
      }
      case 'entries': {
        if (path.length === 0) throw new Error('should at least have one entry')
        const readonly = [...path]
        const last = readonly.pop() as string
        const target = readonly.reduce((acc: Locale, cur): InnerLocale => {
          if (acc === undefined || ['string', 'number'].includes(typeof acc)) throw new Error('unable to find Locale')
          return (acc as InnerLocale)?.[cur] as InnerLocale
        }, write)
        ;(target as InnerLocale)[last] = current
      }
    }
  })

  return yaml.dump(write)
}

export function generateFileName (context: FileContext): string {
  return compiledFileNameSchema.map(k => context[k].replace('-', '_')).join(divider)
}

export async function writeToDisk (locales: LocaleRoot): Promise<unknown> {
  const works: Array<Promise<void>> = []
  for (const locale in locales) {
    const namespaces = locales[locale]
    for (const namespace in namespaces) {
      const context: FileContext = {
        locale,
        namespace,
        extension: 'yml'
      }
      const fileName = generateFileName(context)
      const yaml = formatLocaleData(locales, context)
      const path = join(translationPath, fileName)
      const dir = dirname(path)
      if (!existsSync(path)) {
        mkdirSync(dir, { recursive: true })
      }
      works.push(fs.writeFile(path, yaml, 'utf8'))
    }
  }
  return await Promise.all(works)
}
