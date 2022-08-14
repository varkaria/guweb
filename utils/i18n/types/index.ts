
/* eslint-disable @typescript-eslint/no-unused-vars */
interface InnerLocale {
  [index: string]: Locale
}
type Locale =
| InnerLocale
| string
| number
| undefined
| null

interface LocaleRoot {
  [locale: string]: {
    [namespace: string]: Locale
  }
}
