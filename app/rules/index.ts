import type { RulesetId } from '~~/shared/types/rules'
import * as dnd5e2014 from './dnd5e-2014'

export type Ruleset = typeof dnd5e2014

const RULESETS: Record<RulesetId, Ruleset> = {
  'dnd5e-2014': dnd5e2014,
}

/** Moteur de règles d'une fiche. Une future version de D&D sera un second module de même forme. */
export function getRuleset(id: RulesetId): Ruleset {
  return RULESETS[id]
}
