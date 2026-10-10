import { fr, type MessageKey } from '~/i18n/fr'

export type { MessageKey }

type Params = Record<string, string | number>

/** Clés de base qui possèdent une forme `.one` et `.other`. */
export type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}.one` ? (`${Base}.other` extends MessageKey ? Base : never) : never
}[MessageKey]

/** Indique si une clé construite dynamiquement existe dans le catalogue. */
export function hasMessage(key: string): key is MessageKey {
  return Object.hasOwn(fr, key)
}

/** Texte traduit, avec remplacement des `{param}`. Un paramètre absent laisse le jeton tel quel. */
export function t(key: MessageKey, params?: Params): string {
  const template: string = fr[key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : token,
  )
}

/** Pluriel français : 0 et 1 au singulier. `count` est injecté dans les paramètres. */
export function tCount(key: PluralKey, count: number, params?: Params): string {
  const form = Math.abs(count) < 2 ? 'one' : 'other'
  return t(`${key}.${form}` as MessageKey, { count, ...params })
}
