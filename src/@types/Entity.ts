import { getFromArrayToArray, getRandomInt, randomIntFromInterval } from "../utils";
import {
  ATTACKER_SPEED_WEIGHT,
  DEFENDER_GUARD_WEIGHT,
  DAMAGE_STAT_WEIGHT,
  ATTACKER_LETHALITY_WEIGHT,
  CRIT_DAMAGE_MULTIPLIER,
  ATTACKER_HANDLING_WEIGHT,
  MIND_WEIGHT,
  MIN_FINAL_DAMAGE,
  STARTING_DAMAGE_RANDOM_RANGE,
  DAMAGE_RANDOM_RANGE_FACTOR,
  MAX_FLUXES,
  PERMANENT_MODIFIER_TIER_MULTIPLIER,
  MAX_PERMANENT_MODIFIER_TIER,
  MAX_DECAYING_MODIFIER_COUNTER,
} from "../systemValues";
// import { Action } from "./actions";
import { Ability, Modifier, ModifierDirection } from "./Ability";
import { Action } from "./Action";
// import { Dispatch, SetStateAction } from "react";
// import { HistoricSystem } from "./Historic";

export const SPEED_STATE = {"SLOW": -1, "NORMAL": 1, "FAST": 1};

export type EntityData = {
  id: number,
  name: string,
  image: string,
  description: string,
  level: number,
  stage: number,
  health: number,
  speed: number,
  mind: number,
  sharpDmg: number,
  bluntDmg: number,
  burnDmg: number,
  sharpRes: number,
  bluntRes: number,
  burnRes: number,
  pierce: number,
  lethality: number,
  guard: number,
  handling: number,
  abilities: Ability[]
};

export type EntityStats = {
  health: number,
  healthBase: number,
  healthMax: number,
  speed: number,
  speedBase: number,
  mind: number,
  mindBase: number,
  sharpDmg: number,
  sharpDmgBase: number,
  bluntDmg: number,
  bluntDmgBase: number,
  burnDmg: number,
  burnDmgBase: number,
  sharpRes: number,
  sharpResBase: number,
  bluntRes: number,
  bluntResBase: number,
  burnRes: number,
  burnResBase: number,
  pierce: number,
  pierceBase: number,
  handling: number,
  handlingBase: number,
  guard: number,
  guardBase: number,
  lethality: number,
  lethalityBase: number,
};

export class Entity {
  id = 0;
  name = "";
  image = "";
  description = "";
  level = 0;
  stage = 0;
  stats: EntityStats = {
    health: 0,
    healthBase: 0,
    healthMax: 0,
    speed: 0,
    speedBase: 0,
    mind: 0,
    mindBase: 0,
    sharpDmg: 0,
    sharpDmgBase: 0,
    bluntDmg: 0,
    bluntDmgBase: 0,
    burnDmg: 0,
    burnDmgBase: 0,
    sharpRes: 0,
    sharpResBase: 0,
    bluntRes: 0,
    bluntResBase: 0,
    burnRes: 0,
    burnResBase: 0,
    pierce: 0,
    pierceBase: 0,
    handling: 0,
    handlingBase: 0,
    guard: 0,
    guardBase: 0,
    lethality: 0,
    lethalityBase: 0,
  };
  fluxes = 0;
  abilities: Ability[] = [];
  modifiers: Modifier[] = [];
  isNPC = true;
  played = false;
  // action = {};  // TODO Type this
  side = false; // TODO manage group on front !
  // info: Dispatch<SetStateAction<string[]>>  | undefined = undefined; // the logger
  // TODO handle with 2 type of variables, reset each turn and effect will not triggered
  forceCombo = false;
  forceComboOnAction = false;
  forceCrit = false;
  forceCritOnAction = false;
  preventBlocking = false;
  preventBlockingOnAction = false;

  // data should be an object created from store
  constructor (data: EntityData/*, logger: Dispatch<SetStateAction<string[]>>  | undefined = undefined*/) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.level = data.level;
    this.stage = data.stage;
    this.stats.health = data.health;
    this.stats.healthBase = data.health;
    this.stats.healthMax = data.health;
    this.stats.speed = data.speed;
    this.stats.speedBase = data.speed;
    this.stats.mind = data.mind;
    this.stats.mindBase = data.mind;
    this.stats.sharpDmg = data.sharpDmg;
    this.stats.sharpDmgBase = data.sharpDmg;
    this.stats.bluntDmg = data.bluntDmg;
    this.stats.bluntDmgBase = data.bluntDmg;
    this.stats.burnDmg = data.burnDmg;
    this.stats.burnDmgBase = data.burnDmg;
    this.stats.sharpRes = data.sharpRes;
    this.stats.sharpResBase = data.sharpRes;
    this.stats.bluntRes = data.bluntRes;
    this.stats.bluntResBase = data.bluntRes;
    this.stats.burnRes = data.burnRes;
    this.stats.burnResBase = data.burnRes;
    this.stats.pierce = data.pierce;
    this.stats.pierceBase = data.pierce;
    this.stats.handling = data.handling;
    this.stats.handlingBase = data.handling;
    this.stats.guard = data.guard;
    this.stats.guardBase = data.guard;
    this.stats.lethality = data.lethality;
    this.stats.lethalityBase = data.lethality;
    this.setFluxesFromMind();
    this.abilities = data.abilities;
    // this.info = logger;
  }

  // // Set the logger
  // setLogger(logger: Dispatch<SetStateAction<string[]>> | undefined) {
  //   this.info = logger;
  // }

  // Used to add log in log obj
  log(message: string) {
    // if (!this.info)
    //   return;
    // this.info((currentInfo) => [...currentInfo, message]);
  }

  // return a ability of the entity or undefined
  getAbility(abilityId: number) {
    return this.abilities.find((ability) => ability.id == abilityId);
  }

  // Set entity's fluxes from mind stat
  setFluxesFromMind() {
    this.fluxes = Math.floor(this.stats.mind / MIND_WEIGHT) > MAX_FLUXES ? MAX_FLUXES : Math.floor(this.stats.mind / MIND_WEIGHT);
  }

  // Return true or false depending on the entity can launch a ability
  isEntityAbleToPlay() {
    // Stun
    if (this.isModifierPresent(41))
      return false;
    for (let i = 0; i < this.abilities.length; i++)
      if (this.abilities[i].isMagical == false)
        return true;
    return this.fluxes > 0 ? true : false;
  }

  // Return true or false if the parry roll is a success
  isBlocking() {
    if (this.stats.guard * DEFENDER_GUARD_WEIGHT >= getRandomInt(101)) {
      this.log(`${this.name} blocked the attack!`);
      return true;
    }
    return false;
  }

  // Return true if the entity can't stop the target from blocking, false otherwise
  allowTargetToBlock() {
    // Rules
    if (this.preventBlockingOnAction || this.preventBlocking) {
      this.preventBlockingOnAction = false;
      this.preventBlocking = false;
      return false;
    }    
    // Insight
    if (this.isModifierPresent(31))
      return false;
    return true;
  }

  // Return true or false if the combo roll is a success
  isDoingCombo() {
    // Rules
    if (this.forceComboOnAction || this.forceCombo) {
      this.forceComboOnAction = false;
      this.forceCombo = false;
      this.log(`${this.name} is doing a combo!`);
      return true;
    }
    if (this.stats.handling * ATTACKER_HANDLING_WEIGHT >= getRandomInt(101)) {
      this.log(`${this.name} is doing a combo!`);
      return true;
    }
    return false;
  }

  // Calcul damage inflicted by a ability to a target and return the result
  calculateFinalDamage(abilityId: number, target: Entity) {
    let ability = this.getAbility(abilityId);
    let damage = 0;
    let resistance= 0;

    if (!ability) {
      console.log("Error: ability doesn't found");
      return MIN_FINAL_DAMAGE;
    }
    if (ability.type == "SHARP") {
      damage = this.stats.sharpDmg;
      resistance = target.stats.sharpRes;
    }
    else if (ability.type == "BLUNT") {
      damage = this.stats.bluntDmg;
      resistance = target.stats.bluntRes;
    }
    else if (ability.type == "BURN") {
      damage = this.stats.burnDmg;
      resistance = target.stats.burnRes;
    }
    else {
      console.log("Error: ability type not supported.")
    }
    let finalDamage = ability.damage * (1 + damage / DAMAGE_STAT_WEIGHT) / (1 + (resistance * (1 - this.stats.pierce / 100)) / DAMAGE_STAT_WEIGHT);
    finalDamage = Math.round(finalDamage);
    finalDamage = finalDamage < MIN_FINAL_DAMAGE ? MIN_FINAL_DAMAGE : finalDamage;
    finalDamage = finalDamage > STARTING_DAMAGE_RANDOM_RANGE ? this.calcRandomnessDamage(finalDamage) : finalDamage;
    finalDamage = Math.round(finalDamage);
    return finalDamage;
  }
  
  // Calculate the new final damage by applying a randomness range
  calcRandomnessDamage(finalDamage: number) {
    let randomRangeMin = finalDamage - (finalDamage * DAMAGE_RANDOM_RANGE_FACTOR);
    let randomRangeMax = finalDamage + (finalDamage * DAMAGE_RANDOM_RANGE_FACTOR);

    return randomIntFromInterval(randomRangeMin, randomRangeMax);
  }

  // Roll for crit
  isAddingCrit() {
    if (this.forceCritOnAction || this.forceCrit) {
      this.forceCritOnAction = false;
      this.forceCrit = false;
      return true;
    }
    return this.stats.lethality * ATTACKER_LETHALITY_WEIGHT >= getRandomInt(101);
  }

  // Add crit on finalDamage
  addCritOnDamage(finalDamage: number) {
    finalDamage = Math.round(finalDamage * CRIT_DAMAGE_MULTIPLIER);
    this.log(`${this.name} crits on the attack!`);
    return finalDamage;
  }

  // Add Modifiers on finalDamage
  addModifiersOnDamage(finalDamage: number) {
    let finalDamageBase = finalDamage;
    // Strength
    let strengthBuff = this.modifiers.find(modifier => modifier.id === 24);
    if (strengthBuff)
      finalDamage +=  Math.round(strengthBuff.value * finalDamageBase / 100);
    // Weakness
    let weaknessDebuff = this.modifiers.find(modifier => modifier.id === 33);
    if (weaknessDebuff)
      finalDamage -=  Math.round(weaknessDebuff.value * finalDamageBase / 100);
    return finalDamage;
  }

  // Apply damage on entity, return the finalDamage 
  applyDamage(finalDamage: number) {
    let baseFinalDamage = finalDamage;
    // Immunity
    let immunityBuff = this.modifiers.find(modifier => modifier.id === 27);
    if (immunityBuff) {
      this.log(`${this.name} is immune`);
      return 0;
    }
    // Fortitude
    let fortitudeBuff = this.modifiers.find(modifier => modifier.id === 23);
    if (fortitudeBuff)
      finalDamage -=  Math.round(fortitudeBuff.value * baseFinalDamage / 100);
    // Vulnerability
    let vulnerabilityDebuff = this.modifiers.find(modifier => modifier.id === 32);
    if (vulnerabilityDebuff)
      finalDamage +=  Math.round(vulnerabilityDebuff.value * baseFinalDamage / 100);
    // Immortality
    let immortalityBuff = this.modifiers.find(modifier => modifier.id === 28);
    if (immortalityBuff) {
      finalDamage = (this.stats.health - finalDamage) <= immortalityBuff.value ? this.stats.health - immortalityBuff.value : finalDamage;
    }
    this.log(`${this.name} takes ${finalDamage}`);
    this.stats.health -= finalDamage;
    return finalDamage;
  }

  applyHeal(finalHeal: number) {
    // Blight
    if (this.isModifierPresent(40))
      return;
    // Anointed
    if (this.isModifierPresent(43)) {
      finalHeal += this.modifiers.find(modifier => modifier.id === 43)?.value! * finalHeal / 100;
    }
    if (this.stats.health + finalHeal >= this.stats.healthMax)
      finalHeal = this.stats.healthMax - this.stats.health;
    this.stats.health += finalHeal;
    this.log(`${this.name} recover ${finalHeal}`);
  }

  // Reset the stats of the entity to base
  resetStats() {
    this.stats.healthMax = this.stats.healthBase;
    this.stats.speed = this.stats.speedBase;
    this.stats.mind = this.stats.mindBase;
    this.stats.sharpDmg = this.stats.sharpDmgBase;
    this.stats.bluntDmg = this.stats.bluntDmgBase;
    this.stats.burnDmg = this.stats.burnDmgBase;
    this.stats.sharpRes = this.stats.sharpResBase;
    this.stats.bluntRes = this.stats.bluntResBase;
    this.stats.burnRes = this.stats.burnResBase;
    this.stats.pierce = this.stats.pierceBase;
    this.stats.handling = this.stats.handlingBase;
    this.stats.guard = this.stats.guardBase;
    this.stats.lethality = this.stats.lethalityBase;
  }

  // Apply the permanents modifiers on the entity
  applyPermanentModifiers() {
    this.resetStats();
    this.modifiers.forEach((modifier) => {
      if (modifier.type == "PERMANENT" && modifier.direction == "BUFF")
        this.stats[modifier.targetedStat as keyof EntityStats] += Math.round((PERMANENT_MODIFIER_TIER_MULTIPLIER * modifier.stack) * this.stats[modifier.targetedStat + 'Base' as keyof EntityStats] / 100);
      if (modifier.type == "PERMANENT" && modifier.direction == "DEBUFF")
        this.stats[modifier.targetedStat as keyof EntityStats] -= Math.round((PERMANENT_MODIFIER_TIER_MULTIPLIER * modifier.stack) * this.stats[modifier.targetedStat + 'Base' as keyof EntityStats] / 100);
    });
  }

  // Return if the entity should be considered as dead
  isDead() {
    return this.stats.health <= 0 ? true : false;
  }

  // Add a modifier on the entity and apply it
  addModifier(newModifier: Modifier, stackNumber: number, caster: Entity) {
    let targetModifier = this.modifiers.find((modifier) => modifier.id == newModifier.id);
    if (!targetModifier) {
      this.modifiers.push(JSON.parse(JSON.stringify(newModifier)));
      targetModifier = this.modifiers.find((modifier) => modifier.id == newModifier.id) as Modifier;
      // TODO get the last without find method
    }
    targetModifier.stack += stackNumber;
    if (targetModifier.type == "PERMANENT" && targetModifier.stack > MAX_PERMANENT_MODIFIER_TIER)
      targetModifier.stack = MAX_PERMANENT_MODIFIER_TIER;
    else if (targetModifier.type == "DECAYING" && targetModifier.stack > MAX_DECAYING_MODIFIER_COUNTER)
      targetModifier.stack = MAX_DECAYING_MODIFIER_COUNTER;
    if (newModifier.type == "PERMANENT")
      this.applyPermanentModifiers();
  }

  // Decrement decaying modifiers and apply their effect for periodic ones, return false if entity died and true otherwise
  applyDecayingModifier() {
    for (let i = 0; i < this.modifiers.length; i++) {
      if (this.modifiers[i].type == "PERMANENT")
        continue;
      if (this.modifiers[i].timeframe == "PERIODIC") {
        this.applyPeriodicModifier(this.modifiers[i]);
        if (this.isDead())
          return false;
      }
      else
        this.modifiers[i].stack--;
    }
    this.cleanModifiers();
    return true;
  }

  // Decrement periodic modifiers and apply their effect
  applyPeriodicModifier(modifier: Modifier) {
    this.log(`${this.name} is touched by ${modifier.name}`);
    switch(modifier.id) {
      // Recovery
      case 25:
        this.applyHeal(Math.round(modifier.value * this.stats.healthMax / 100));
        break;
      // Meditation
      case 26:
        this.addFluxes(modifier.value);
        break;
      // Bleed
      case 34:
        // break;
      // Shock
      case 35:
        // break;
      // Scald
      case 36:
        // break;
      // Affliction
      case 37:
        this.applyDamage(Math.round(modifier.value * this.stats.healthMax / 100));
        break;
      // Amnesia
      case 38:
        this.removeFluxes(modifier.value);
        break;
      default:
        console.log("Error: periodic modifier can't be apply bc not supported: ", modifier.name, modifier.id);
        return;
    }
    modifier.stack--;
  }

  // Add stacks on decaying modifiers
  addDecayingModifierStacks(direction: ModifierDirection, stacks: number) {
    for (let i = 0; i < this.modifiers.length; i++)
      if (this.modifiers[i].direction == direction && this.modifiers[i].type == "DECAYING")
        this.modifiers[i].stack += stacks;
  }

  // Add fluxes to the entity
  addFluxes(number: number) {
    if (this.fluxes + number >= MAX_FLUXES)
      number = MAX_FLUXES - this.fluxes;
    this.log(`${this.name} gain ${number} fluxes`);
    this.fluxes += number;
  }

  // Use fluxes
  useFluxes(number: number) {
    if (number == 0)
      return;
    this.removeFluxes(number);
  }

  // Remove fluxes to the entity, return the number of fluxes removed
  removeFluxes(number: number) {
    if (this.fluxes - number <= 0)
      number = this.fluxes;
    this.log(`${this.name} lost ${number} fluxes`);
    this.fluxes -= number;
    return number;
  }

  // Check if entity has a modidifier
  isModifierPresent(modifierId: number) {
    return this.modifiers.findIndex(modifier => modifier.id === modifierId) != -1;
  }

  // Remove modifiers if their stack is 0
  cleanModifiers() {
    this.modifiers = this.modifiers.filter((modifier) => modifier.stack > 0);
  }

  // Return true if entity is confused, false otherwise
  isConfused() {
    if (!this.isModifierPresent(42))
      return false;
    if (this.modifiers.find(modifier => modifier.id == 42)!.value >= getRandomInt(101)) {
      this.log(`${this.name} is confused!`);
      return true;
    }
    return false;
  }

  // Return the speed state of the entity depending 
  getSpeedState() {
    let speedState = SPEED_STATE.NORMAL;
    // Alacrity
    if (this.isModifierPresent(30))
      speedState += SPEED_STATE.FAST;
    // Lethargy
    if (this.isModifierPresent(39))
      speedState += SPEED_STATE.SLOW;
    return speedState;
  }

  // Reset the rules modification at the end of turn
  resetRulesOnAction() {
    this.forceComboOnAction = false;
    this.forceCritOnAction = false;
    this.preventBlockingOnAction = false;
  }

  // Cleans all the debuff on entity, return the number of debuff cleansed
  cleans() {
    let afterCleansModifiers = this.modifiers.filter(modifier => modifier.direction == "BUFF");
    let numberCleansed = this.modifiers.length - afterCleansModifiers.length;
    this.modifiers = afterCleansModifiers;
    return numberCleansed;
  }

  // Purge all the buff on entity, return the number of buff purged
  purge() {
    let afterPurgeModifiers = this.modifiers.filter(modifier => modifier.direction == "DEBUFF");
    let numberPurged = this.modifiers.length - afterPurgeModifiers.length;
    this.modifiers = afterPurgeModifiers;
    return numberPurged;
  }

  // Return true if entity has positive modifiers, false otherwise
  hasPositiveModifier() {
    for (let modifier of this.modifiers)
      if (modifier.direction == "BUFF")
        return true;
    return false;
  }

  // Return true if entity has negative modifiers, false otherwise
  hasNegativeModifier() {
    for (let modifier of this.modifiers)
      if (modifier.direction == "DEBUFF")
        return true;
    return false;
  }  
}

// ------------------------------------ Weapon ------------------------------------

export type WeaponMintStats = {
  health: number,
  speed: number,
  mind: number,
  offensiveStats: {
    sharpDamage: number,
    bluntDamage: number,
    burnDamage: number,
    pierce: number,
    lethality: number,
  },
  defensiveStats: {
    sharpResistance: number,
    bluntResistance: number,
    burnResistance: number,
    guard: number,
  },
  handling: number
}

export type WeaponMint = {
  name: string,
  description: string,
  image: string,
  level: number,
  stage: number,
  weaponStats: WeaponMintStats,
  xp: number,
  identity: string,
  abilities: string[],
}

export type Identity = "None" | string;

export type WeaponDataAddition = {
  identity: Identity,
  xp: number
}

export type WeaponData = EntityData & WeaponDataAddition;

export class Weapon extends Entity {
  identity: Identity = "None";
  xp = 0;
  deck: Ability[] = [];     // only on weapon for the moment... (replace abilities on Entity)
  discard: Ability[] = [];  // only on weapon for the moment...
  hand: Ability[] = [];     // only on weapon for the moment...

  constructor(data: WeaponData/*, logger: Dispatch<SetStateAction<string[]>>  | undefined = undefined*/) {
    super(data/*, logger*/);
    this.identity = data.identity;
    this.isNPC = false; // TODO handle when pvp again offline friends
    this.xp = data.xp;
  }

  clone() {
    return new Weapon({
      id: this.id,
      name: this.name,
      image: this.image,
      description: this.description,
      level: this.level,
      stage: this.stage,
      xp: this.xp,
      health: this.stats.health,
      speed: this.stats.speed,
      mind: this.stats.mind,
      sharpDmg: this.stats.sharpDmg,
      bluntDmg: this.stats.bluntDmg,
      burnDmg: this.stats.burnDmg,
      sharpRes: this.stats.sharpRes,
      bluntRes: this.stats.bluntRes,
      burnRes: this.stats.burnRes,
      pierce: this.stats.pierce,
      handling: this.stats.handling,
      guard: this.stats.guard,
      lethality: this.stats.lethality,
      abilities: this.abilities,
      identity: this.identity
    });
  }

  // fill the deck with all the abilities
  fillDeck(abilities: Ability[]) {
    this.deck = abilities;
    // set new idDeck base on index
    for (let i = 0; i < this.deck.length; i++)
      this.deck[i].idInDeck = i;
  }

  // draw a random ability from deck and add it in the hand
  drawOneRandomFromDeck() {
    getFromArrayToArray(this.deck, this.hand, this.deck[getRandomInt(this.deck.length)]);
  }

  // remove an ability from the hand and add it in the discard
  discardFromHand(ability: Ability) {
    getFromArrayToArray(this.hand, this.discard, ability);
  }

  // refill the deck with the discard
  refillDeckFromDiscard() {
    while (this.discard.length > 0)
      this.deck.push(this.discard.pop() as Ability);
    console.log("end of refill deck");
  }
}

// ------------------------------------ Monster ------------------------------------

/**
 * Monster data from the Mongo DB
 */
export type MonsterDataFromDB = {
  _id: string, // id generated on the DB side
  id: number,
  name: string,
  level: number,
  difficulty: number,
  health: number,
  speed: number,
  mind: number,
  sharpDmg: number,
  bluntDmg: number,
  burnDmg: number,
  sharpRes: number,
  bluntRes: number,
  burnRes: number,
  pierce: number,
  lethality: number,
  guard: number,
  handling: number,
  abilities: number[],
  description: string,
  image: string
};

export type MonsterDataAddition = {
  difficulty: number
};

export type MonsterData = EntityData & MonsterDataAddition;

export class Monster extends Entity {
  difficulty = 0;

  constructor(data: MonsterData/*, logger: Dispatch<SetStateAction<string[]>>  | undefined = undefined*/) {
    super(data/*, logger*/);
    this.isNPC = true;
    this.difficulty = data.difficulty;
  }

  clone() {
    return new Monster({
      id: this.id,
      name: this.name,
      image: this.image,
      description: this.description,
      level: this.level,
      stage: this.stage,
      health: this.stats.health,
      speed: this.stats.speed,
      mind: this.stats.mind,
      sharpDmg: this.stats.sharpDmg,
      bluntDmg: this.stats.bluntDmg,
      burnDmg: this.stats.burnDmg,
      sharpRes: this.stats.sharpRes,
      bluntRes: this.stats.bluntRes,
      burnRes: this.stats.burnRes,
      pierce: this.stats.pierce,
      handling: this.stats.handling,
      guard: this.stats.guard,
      lethality: this.stats.lethality,
      abilities: this.abilities,
      difficulty: this.difficulty
    });
  }

  launchRandomAbility(target: Monster | Weapon, isCombo: boolean, turn: number) {
    let monsterAbility: Ability = this.abilities[getRandomInt(this.abilities.length)];
    let fluxesUsed = 0;

    while (1) {
      monsterAbility = this.abilities[getRandomInt(this.abilities.length)];
      if (!monsterAbility.isMagical)
        break;
      else {
        if (this.fluxes > 0) {
          fluxesUsed = getRandomInt(this.fluxes) + 1;
          break;
        }
        // check if monster is blocked -> only fluxes ability with 0 fluxes
        if (!this.isEntityAbleToPlay()) {
          console.log("monster can't play, action skipped");
          return undefined;
        }
      }
    }
    this.useFluxes(fluxesUsed);
    // if (!this.info)
    //   return undefined;
    return new Action({caster: this, ability: monsterAbility, target: target, hasBeenDone: false, isCombo: isCombo, fluxesUsed: fluxesUsed,/* info: this.info,*/ currentTurn: turn});
  }
}