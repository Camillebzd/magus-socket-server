export const ATTACKER_SPEED_WEIGHT = 2;
export const DEFENDER_GUARD_WEIGHT = 0.57;
export const DAMAGE_STAT_WEIGHT = 25;
export const ATTACKER_LETHALITY_WEIGHT = 0.77;
export const CRIT_DAMAGE_MULTIPLIER = 1.5;
export const ATTACKER_HANDLING_WEIGHT = 0.37;
export const MIND_WEIGHT = 8;
export const MIN_FINAL_DAMAGE = 1;
export const STARTING_DAMAGE_RANDOM_RANGE = 5;
export const DAMAGE_RANDOM_RANGE_FACTOR = 0.2;
export const MAX_FLUXES = 6;
export const PERMANENT_MODIFIER_TIER_MULTIPLIER = 10; // percentage
export const MAX_PERMANENT_MODIFIER_TIER = 6;
export const MAX_DECAYING_MODIFIER_COUNTER = 6;
export const HAND_SIZE = 4;
export const DECK_MAX_SIZE = 10;

// Change manually in code in scripts/abilities.ts
export const TIER_ONE_COPIES = 1;
export const TIER_TWO_COPIES = 2;
export const TIER_THREE_COPIES = 4;

// enum for the target system
export enum TARGET_ABILITY { TARGET_OF_ABILITY = 1, CASTER_OF_ABILITY, ABILITY_ITSELF, COMBO_ABILITY_TRIGGERED, NONE = 13 }

// enum for the condition system
export enum CONDITIONS {
  NO_CONDITION = 1,
  ABILITY_IS_CRIT = 2,
  ABILITY_TRIGGERS_COMBO = 3,
  ABILITY_BLOCKED_BY_TARGET = 4,
  TARGET_ALREADY_ACTED = 5,
  TARGET_NOT_ALREADY_ACTED = 6,
  TARGET_HAS_LESS_HP_THAN_CASTER = 7,
  TARGET_HAS_MORE_HP_THAN_CASTER = 8,
  TARGET_BEARS_POSITIVE_MODIFIER = 9,
  TARGET_BEARS_NEGATIVE_MODIFIER = 10,
  TARGET_DOESNT_BEARS_ANY_MODIFIER = 11,
  CASTER_ALREADY_USED_THIS_ABILITY_LAST_TURN = 12,
  CASTER_BEARS_POSITIVE_MODIFIER = 13,
  CASTER_BEARS_NEGATIVE_MODIFIER = 14,
  CASTER_DOESNT_BEARS_ANY_MODIFIER = 15,
  CASTER_TOOK_DAMAGE_THIS_TURN_OR_LAST_ONE = 16,
  TARGET_HAS_50_PERCENT_HP_OR_LESS = 17,
  TARGET_HAS_20_PERCENT_HP_OR_LESS = 18,
};