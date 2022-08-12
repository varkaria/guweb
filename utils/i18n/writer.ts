// // @ts-check
// import {
//   compiledFileNameSchema,
//   compiledFileSchema,
//   paths as translationPath,
//   divider,
//   contextToFileName,
//   FileContext
// } from './config'
// import yaml from 'js-yaml'
// import _path, { join } from 'path'
// import fs from 'fs/promises'
// import { existsSync, mkdirSync } from 'fs'

// export function formatLocaleData (locale: Record<string, any>, context: FileContext) {
//   const current = locale[context.locale][context.namespace]
//   return yaml.dump(current)
// }

// export function writeToDisk (locales: any): void {
//   throw new Error('deprecated!! nothing has changed.')
//   for (const locale in locales) {
//       const namespaces = locales[locale]
//       for (const namespace in namespaces) {
//           const entries = namespaces[namespace]
//           const context = {
//               locale,
//               namespace,
//               extension: 'yml'
//           }
//           const fileName = contextToFileName(context)
//           const yaml = formatLocaleData(locales, context)
//           const path = join(translationPath, fileName)
//           const dir = _path.dirname(path)
//           if (!existsSync(path)) {
//               mkdirSync(dir, {recursive: true})
//           }
//           fs.writeFile(path, yaml, 'utf8')
//       }
//   }
// }
