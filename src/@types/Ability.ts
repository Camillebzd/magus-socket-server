export type EffectValue = {
  id: number;
  value: number;
};

export type AbilityType = "SHARP" | "BLUNT" | "BURN" | "SPECIAL";

// Env var for the TIER_ONE_COPIES, TIER_TWO_COPIES, TIER_THREE_COPIES
export type Tier = 1 | 2 | 4; 

export type AbilityData = {
  id: number,
  name: string,
  damage: number,
  initiative: number,
  type: AbilityType,
  isMagical: boolean,
  effects: number[],
  effectsValue: EffectValue[],
  tier: Tier,
};

export type AbilityFromDB = AbilityData & {_id: string};

export class Ability {
  id: number = 0;
  name: string = "Unknown";
  damage: number = 0;
  initiative: number = 0;
  type: AbilityType = "SHARP";
  isMagical: boolean = false;
  effects: number[] = [];
  effectsValue: EffectValue[] = [];
  tier: Tier = 4;
  idInDeck = 0;

  constructor(data: AbilityData | AbilityFromDB) {
    this.id = data.id;
    this.name = data.name;
    this.damage = data.damage;
    this.initiative = data.initiative;
    this.type = data.type;
    this.isMagical = data.isMagical;
    this.effects = data.effects;
    this.effectsValue = data.effectsValue;
    this.tier = data.tier || 4;
  }

  extractData() {
    return {
      id: this.id,
      name: this.name,
      damage: this.damage,
      initiative: this.initiative,
      type: this.type,
      isMagical: this.isMagical,
      effects: this.effects,
      effectsValue: this.effectsValue,
      tier: this.tier,
    } as AbilityData;
  }

  clone() {
    return new Ability({
      id: this.id, 
      name: this.name,
      damage: this.damage,
      initiative: this.initiative,
      type: this.type,
      isMagical: this.isMagical,
      effects: this.effects,
      effectsValue: this.effectsValue,
      tier: this.tier
    });
  }
};

export type AftermathType = "MODIFIER" | "RULE";

export type Effect = {
  id: number;
  conditionId: number;
  targetId: number;
  applyChance: number;
  aftermathType: AftermathType;
  aftermathId: number;
};

export type ModifierType = "PERMANENT" | "DECAYING";

export type ModifierDirection = "BUFF" | "DEBUFF";

export type ModifierTimeframe = "NONE" | "CONTINUOUS" | "PERIODIC";

export type Modifier = {
  id: number;
  name: string;
  type: ModifierType;
  direction: ModifierDirection;
  timeframe: ModifierTimeframe;
  value: number;
  stack: number;
  targetedStat: string;
  description: string;
};

export type Condition = {
  id: number;
  description: string;
};

export type Rule = {
  id: number;
  orderId: number;
};

export type Target = {
  id: number;
  description: string;
}

export type Order = {
  id: number;
  description: string;  
};