import glob from 'glob'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

import { compiledFileNameSchema, compiledFileSchema, compiled as translationPath, divider, FileContext } from './config'

const parseFileName = (file: string): FileContext => {
  const fileName = path.relative(translationPath, file)
  const parts = fileName.split(divider)
  return compiledFileNameSchema.reduce((acc: Partial<FileContext>, part: 'namespace' | 'locale' | 'extension', index) => {
    acc[part] = parts[index]
    return acc
  }, {}) as FileContext
}

const parseLocale = (file: string, context: FileContext): LocaleRoot | undefined => {
  const locale = yaml.load(fs.readFileSync(file, 'utf8')) as Locale | Locale[]
  const _parse = (locale: Locale): LocaleRoot => {
    const rtn: LocaleRoot = {
      [context.locale]: {
        [context.namespace]: null
      }
    }
    let current = locale
    let currentLocale: string
    compiledFileSchema.forEach(part => {
      switch (part) {
        case 'locale': {
          currentLocale = context.locale
          current = (current as InnerLocale)?.[currentLocale]
          break
        }
        case 'entries': {
          if (currentLocale === undefined) break
          rtn[currentLocale][context.namespace] = current
          break
        }
        default: {
          throw new Error('unknown type of file')
        }
      }
    })
    return rtn
  }
  if (Array.isArray(locale)) {
    const toMerge = locale.map(_parse)
    let rtn = {}
    for (const item of toMerge) {
      rtn = {
        ...rtn,
        ...item
      }
    }
  } else {
    return _parse(locale)
  }
}
/* ----------------------------------------------------------------
** return format: {
  [locale]: {
      [namespace]: {
          ...entries
      }
  }
}
*/
export const readLocales = async (): Promise<LocaleRoot> => await new Promise((resolve, reject) => {
  glob(path.join(translationPath, '**/*.yml'), (err, matches) => {
    if (err != null) throw err
    const locales = matches.reduce(async (acc: Promise<LocaleRoot> | LocaleRoot, match): Promise<LocaleRoot> => {
      try {
        acc = await acc
        const name = parseFileName(match)
        const data = parseLocale(match, name)
        if (data === undefined) { return acc }
        if (acc[name.locale] == null) { acc[name.locale] = {} }
        acc[name.locale] = {
          ...acc[name.locale] as Record<string, Locale>,
          ...data[name.locale] as Record<string, Locale>
        }
        return acc
      } catch (error) {
        reject(error)
        return acc as LocaleRoot
      }
    }, {})

    resolve(locales)
  })
})
