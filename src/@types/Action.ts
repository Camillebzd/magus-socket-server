import { fetchFromDB, getRandomInt } from "../utils";
import { 
  TARGET_ABILITY,
  CONDITIONS
} from "../systemValues";
import { Monster, Weapon } from "./Entity";
import { Ability, AftermathType, Rule, Modifier, Condition, EffectValue, Effect, Target, Order } from "./Ability";
// import { SetStateAction, Dispatch } from "react";

import { HistoricSystem } from "./Historic";

// Unstable...
let effects: Effect[] = [];
let rules: Rule[] = [];
let modifiers: Modifier[] = [];
let targets: Target[] = [];
let conditions: Condition[] = [];
let orders: Order[] = [];

const initData = async () => {
  const effectsData: Effect[] | undefined = await fetchFromDB("abilities/effects");
  if (effectsData)
    effects = effectsData;
  else
    console.log("Error: can't fetch abilities' effects.");
  const rulesData: Rule[] | undefined = await fetchFromDB("abilities/rules");
  if (rulesData)
    rules = rulesData;
  else
    console.log("Error: can't fetch rules for abilities.");
  const modifiersData: Modifier[] | undefined = await fetchFromDB("abilities/modifiers");
  if (modifiersData)
    modifiers = modifiersData;
  else
    console.log("Error: can't fetch modifiers for abilities.");
  const targetsData: Target[] | undefined = await fetchFromDB("abilities/targets");
  if (targetsData)
    targets = targetsData;
  else
    console.log("Error: can't fetch targets for abilities.");
  const conditionsData: Condition[] | undefined = await fetchFromDB("abilities/conditions");
  if (conditionsData)
    conditions = conditionsData;
  else
    console.log("Error: can't fetch conditions for abilities.");
  const ordersData: Order[] | undefined = await fetchFromDB("abilities/orders");
  if (ordersData)
    orders = ordersData;
  else
    console.log("Error: can't fetch orders for abilities.");
}
initData();

export enum END_OF_TURN {NORMAL, TARGET_BLOCKED, PLAYER_COMBO, MONSTER_COMBO, PLAYER_DIED, MONSTER_DIED};

export enum RULE_ORDER {
  VERY_BEGINNING = 1,
  BEFORE_SPECIAL_CHECK = 2,
  BEFORE_PARRY_CHECK = 3,
  BEFORE_DAMAGE_CALCULATION = 4,
  BEFORE_CRIT_CALCULATION = 5,
  BEFORE_DAMAGE_APPLICATION = 6,
  BEFORE_MODIFIER_APPLICATION = 7,
  BEFORE_DEATHS_CHECK = 8,
  BEFORE_COMBO_CHECK = 9,
  VERY_END = 10,
  END_RESOLVE_ACTION = 11
};

export type ActionData = {
  caster: Weapon | Monster;
  target: Weapon | Monster;
  ability: Ability;
  isCombo: boolean;
  hasBeenDone: boolean;
  fluxesUsed: number;
  // info: Dispatch<SetStateAction<string[]>>;
  currentTurn: number;
};

export class Action {
  caster: Weapon | Monster;
  target: Weapon | Monster;
  ability: Ability;
  isCombo = false;
  hasBeenDone = false;
  fluxesUsed = 0;
  // info: Dispatch<SetStateAction<string[]>> | undefined = undefined;
  abilityWasCrit = false;
  abilityWasBlocked = false;
  triggeredCombo = false;
  finalDamage = 0;
  damageInflicted = 0;
  modifiersCleansed = 0;
  modifiersPurged = 0;
  currentTurn: number = 0;
  historicSystem: null | HistoricSystem = null;

  constructor(data: ActionData) {
    this.caster = data.caster;
    this.target = data.target;
    this.ability = data.ability;
    this.isCombo = data.isCombo || false;
    this.hasBeenDone = data.hasBeenDone || false;
    this.fluxesUsed = data.fluxesUsed || 0;
    // this.info = data.info;
    this.currentTurn = data.currentTurn || 0;
  }

  // set hystoric system, carefule to not circulare link or too deep copy
  setHistoricSystem(historicSystem: HistoricSystem) {
    this.historicSystem = historicSystem;
  }

  // Used to add log in log obj
  log(message: string) {
    // if (!this.info)
    //   return;
    // this.info((currentInfo) => [...currentInfo, message]);
  }

  // Main fct that resolve the action
  resolve() {
    this.applyRule(RULE_ORDER.VERY_BEGINNING);
    this.log(`${this.caster.name} launch ${this.ability.name}.`);
    if (this.caster.isConfused()) {
      this.endOfResolve();
      this.log(`${this.caster.name} is confused!`);
      return END_OF_TURN.NORMAL;
    }
    this.applyRule(RULE_ORDER.BEFORE_SPECIAL_CHECK);
    if (this.ability.type != "SPECIAL") {
      this.applyRule(RULE_ORDER.BEFORE_PARRY_CHECK);
      // 3. & 4. Parry
      if (this.target.isBlocking() && this.caster.allowTargetToBlock()) {
        this.abilityWasBlocked = true;
        this.endOfResolve();
        return END_OF_TURN.TARGET_BLOCKED;
      }
      this.applyRule(RULE_ORDER.BEFORE_DAMAGE_CALCULATION);
      // 5., 6., 7. & 8. Calc dmg + crit + modifiers
      this.finalDamage = this.caster.calculateFinalDamage(this.ability.id, this.target);
      this.applyRule(RULE_ORDER.BEFORE_CRIT_CALCULATION);
      if (this.caster.isAddingCrit()) {
        this.abilityWasCrit = true;
        this.finalDamage = this.caster.addCritOnDamage(this.finalDamage);
      }
      this.finalDamage = this.caster.addModifiersOnDamage(this.finalDamage);
      this.applyRule(RULE_ORDER.BEFORE_DAMAGE_APPLICATION);
      // 9. Apply dmg & buff / debuff
      this.damageInflicted = this.target.applyDamage(this.finalDamage);
    }
    this.applyRule(RULE_ORDER.BEFORE_MODIFIER_APPLICATION);
    this.addModifiers();
    this.applyRule(RULE_ORDER.BEFORE_DEATHS_CHECK);
    // check health
    if (this.target.isDead()) {
      this.endOfResolve();
      return this.target.isNPC == false ? END_OF_TURN.PLAYER_DIED : END_OF_TURN.MONSTER_DIED;
    }
    if (this.caster.isDead()) {
      this.endOfResolve();
      return this.caster.isNPC == false ? END_OF_TURN.MONSTER_DIED : END_OF_TURN.PLAYER_DIED;
    }
    this.applyRule(RULE_ORDER.BEFORE_COMBO_CHECK);
    // 10. Combo
    if (this.caster.isDoingCombo() && !this.isCombo) {
      this.triggeredCombo = true;
      this.endOfResolve();
      return this.caster.isNPC == false ? END_OF_TURN.PLAYER_COMBO : END_OF_TURN.MONSTER_COMBO;
    }
    this.applyRule(RULE_ORDER.VERY_END);
    this.endOfResolve();
    return END_OF_TURN.NORMAL;
  }

  // Call at the end of the resolve 
  endOfResolve() {
    this.applyRule(RULE_ORDER.END_RESOLVE_ACTION);
    this.hasBeenDone = true;
  }

  // Add all modifiers from the action
  addModifiers() {
    this.ability.effects.forEach((actionEffect) => {
      let effect = effects.find((effect) => effect.id == actionEffect);
      if (!effect) {
        console.log("Error: this effect is not supported");
        return;
      }
      // Modifier
      if (effect.aftermathType != "MODIFIER") {
        return;
      }
      // ApplyChance
      if (getRandomInt(100) >= effect.applyChance) {
        console.log("failed to apply modifier");
        return;
      }
      // Target
      let targetObj = targets.find((target) => target.id === effect!.targetId);
      if (targetObj == undefined) {
        console.log("Error: this target is not supported");
        return;
      }
      let target = this.getTarget(targetObj);
      if (target == undefined) {
        console.log("Error: this target type is not supported: ", targetObj.id);
        return;
      }
      // Condition
      let condition = conditions.find((condition) => condition.id === effect!.conditionId);
      if (condition == undefined) {
        console.log("Error: this condition is not supported");
        return;
      }
      if (!this.checkCondition(condition, target)) {
        console.log("Condition not met");
        return;
      }
      // Modifier Info
      let modifier = this.getAftermath(effect.aftermathId, "MODIFIER") as Modifier;
      if (modifier == undefined || !Object.keys(modifier).length) {
        console.log("Error: modifier empty or not supported");
        return;
      }
      // Modifier stack
      let modifierStack = this.getAftermathValue(effect.id, this.ability.effectsValue);
      if (modifierStack == -1) {
        console.log("Error: modifier stack is not set on effect");
        return;
      }
      // Flux quantity
      let fluxQuantity = this.ability.isMagical ? this.fluxesUsed : 1;
      for (let i = 0; i < fluxQuantity; i++) {
        target.addModifier(modifier, modifierStack, this.caster);
      }
    });
  }

  // Try to apply all the rules that respect the orderId call
  applyRule(orderId: number) {
    this.ability.effects.forEach((actionEffect) => {
      let effect = effects.find((effect) => effect.id == actionEffect);
      if (effect == undefined) {
        console.log("Error: this effect is not supported on ability ", this.ability.name);
        return;
      }
      // Rule
      if (effect.aftermathType != "RULE") {
        // console.log("This is not a rule");
        return;
      }
      let rule = this.getAftermath(effect.aftermathId, "RULE") as Rule;
      if (!rule) {
        console.log("Error: rule unknown on ability ", this.ability.name);
        return;
      }
      // Order
      let order = orders.find(order => order.id == rule.orderId);
      if (!order) {
        console.log("Error: order not supported on ability ", this.ability.name);
        return;
      }
      if (order.id != orderId)
        return;
      // ApplyChance
      if (getRandomInt(100) >= effect.applyChance) {
        console.log("failed to apply rule");
        return;
      }
      // Target
      let targetObj = targets.find((target) => target.id === effect!.targetId);
      if (targetObj == undefined) {
        console.log("Error: this target is not supported on ability ", this.ability.name);
        return;
      }
      let target = this.getTarget(targetObj);
      if (target === undefined) {
        console.log("Error: this target type is not supported: ", targetObj.id);
        return;
      }
      // Condition
      let condition = conditions.find((condition) => condition.id === effect!.conditionId);
      if (condition == undefined) {
        console.log("Error: this condition is not supported on ability ", this.ability.name);
        return;
      }
      if (!this.checkCondition(condition, target)) {
        console.log("Condition not met");
        return;
      }
      // Rule value
      let ruleValue = this.getAftermathValue(effect.id, this.ability.effectsValue);
      if (ruleValue == -1) {
        console.log("Error: rule value is not set on effect on ability ", this.ability.name);
        return;
      }
      // Flux quantity
      let fluxQuantity = this.ability.isMagical ? this.fluxesUsed : 1;
      this.executeRule(rule, ruleValue, target, fluxQuantity);
    });
  }

  // Execute the rule with the value given on the target
  executeRule(rule: Rule, ruleValue: number, target: Weapon | Monster | null, fluxQuantity: number) {
    switch (rule.id) {
      // Gain X fluxes
      case 1:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.addFluxes(ruleValue * fluxQuantity);
        break;
      // Do nothing
      case 2:
        this.log("NOTHING HAPPEN");
        break;
      // Random ability launch
      case 3:
        console.log("TODO: the random ability launch...");
        break;
      // Heal the target from the damage of the ability
      case 4:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.applyHeal(Math.round(ruleValue * fluxQuantity * this.damageInflicted / 100));
        break;
      // Force a combo on the target
      case 5:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.forceComboOnAction = true;
        break;
      // Force a crit on the target
      case 6:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.forceCritOnAction = true;
        break;
      // Buff the target by doesn't letting the target of an action be able to block
      case 7:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.preventBlockingOnAction = true;
        break;
      // Add additional damage to final damage
      case 8:
        this.finalDamage += ruleValue * fluxQuantity;
        break;
      // Priority on action, handled in getSpeedRule
      case 9:
        break;
      case 10:
        break;
      // Multiply final damage
      case 11:
        console.log("before: ", this.finalDamage);
        this.finalDamage *= ruleValue * fluxQuantity;
        console.log("after: ", this.finalDamage);
        break;
      // Cleans the target
      case 12:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        this.modifiersCleansed = target.cleans();
        break;
      // Multiply final damage by the number of negative effect cleansed by this ability
      case 13:
        this.finalDamage *= this.modifiersCleansed * ruleValue * fluxQuantity;
        break;
      // Add some stack on all debuff on the target
      case 14:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.addDecayingModifierStacks("DEBUFF", ruleValue * fluxQuantity);
        break;
      // Purge the target (remove positive modifiers)
      case 15:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        this.modifiersPurged = target.purge();
        break;
      // Add additional damage for each flux on the target of action
      case 16:
        this.finalDamage += ruleValue * this.target.fluxes * fluxQuantity;
      // Add additional damage for each flux on the caster of action
      case 17:
        this.finalDamage += ruleValue * this.caster.fluxes * fluxQuantity;
      // Remove fluxes on the target and add them to the caster
      case 18:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        this.caster.fluxes += target.removeFluxes(ruleValue * fluxQuantity);
      // Heal % of missing hp
      case 19:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.applyHeal(Math.round(ruleValue * fluxQuantity * (target.stats.healthMax - target.stats.health) / 100));
        break;
      // Heal % of maximum hp
      case 20:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.applyHeal(Math.round(ruleValue * fluxQuantity * target.stats.healthMax / 100));
        break;
      // Removes fluxes
      case 23:
        if (target == null) {
          console.log(`target not specified for rule: ${rule} `);
          break;
        }
        target.removeFluxes(ruleValue * fluxQuantity);
        break;
      default:
        console.log(`Error: rule not supported for the moment with id: ${rule.id}.`);
        return;
    }
  }

  // return true or false if the effect condition is valid or not
  checkCondition(condition: Condition, target: Weapon | Monster | null) {
    switch (condition.id) {
      // no condition
      case CONDITIONS.NO_CONDITION:
        return true;
      case CONDITIONS.ABILITY_IS_CRIT:
        return this.abilityWasCrit;
      case CONDITIONS.ABILITY_TRIGGERS_COMBO:
        return this.triggeredCombo;
      case CONDITIONS.ABILITY_BLOCKED_BY_TARGET:
        return this.abilityWasBlocked;
      case CONDITIONS.TARGET_ALREADY_ACTED:
        if (target === null) {
          console.log("Error: try to use condition target already acted with a null target.");
          return false;
        }
        if (!this.historicSystem) {
          console.log("Error: historic system is null in checkCondition for target already acted.");
          return false;
        }
        return this.historicSystem.hasAlreadyActed(target, this.currentTurn - 1);
      case CONDITIONS.TARGET_NOT_ALREADY_ACTED:
        if (target === null) {
          console.log("Error: try to use condition target not already acted with a null target.");
          return false;
        }
        if (!this.historicSystem) {
          console.log("Error: historic system is null in checkCondition for target not already acted.");
          return false;
        }
        return !this.historicSystem.hasAlreadyActed(target, this.currentTurn - 1);
      case CONDITIONS.TARGET_HAS_LESS_HP_THAN_CASTER:
        return this.target.stats.health < this.caster.stats.health;
      case CONDITIONS.TARGET_HAS_MORE_HP_THAN_CASTER:
        return this.target.stats.health > this.caster.stats.health;
      case CONDITIONS.TARGET_BEARS_POSITIVE_MODIFIER:
        return this.target.hasPositiveModifier();
      case CONDITIONS.TARGET_BEARS_NEGATIVE_MODIFIER:
        return this.target.hasNegativeModifier();
      case CONDITIONS.TARGET_DOESNT_BEARS_ANY_MODIFIER:
        return this.target.modifiers.length == 0;
      case CONDITIONS.CASTER_ALREADY_USED_THIS_ABILITY_LAST_TURN:
        if (target === null) {
          console.log("Error: try to use CASTER_ALREADY_USED_THIS_ABILITY_LAST_TURN with a null target.");
          return false;
        }
        if (!this.historicSystem) {
          console.log("Error: historic system is null in checkCondition for target CASTER_ALREADY_USED_THIS_ABILITY_LAST_TURN.");
          return false;
        }
        return this.historicSystem.hasAlreadyLaunchedAbility(target, this.ability, this.currentTurn - 1);
      case CONDITIONS.CASTER_BEARS_POSITIVE_MODIFIER:
        return this.caster.hasPositiveModifier();
      case CONDITIONS.CASTER_BEARS_NEGATIVE_MODIFIER:
        return this.caster.hasNegativeModifier();
      case CONDITIONS.CASTER_DOESNT_BEARS_ANY_MODIFIER:
        return this.caster.modifiers.length == 0;
      case CONDITIONS.CASTER_TOOK_DAMAGE_THIS_TURN_OR_LAST_ONE:
        return false; // TODO with historic system
      default:
        console.log("Error: condition not supported");
        return false;
    }
  }

  // return the entity obj targeted by the target input obj, null if no target selected and undefined if not supported
  getTarget(target: Target) {
    switch(target.id) {
      case TARGET_ABILITY.TARGET_OF_ABILITY:
        return this.target;
      case TARGET_ABILITY.CASTER_OF_ABILITY:
        return this.caster;
      case TARGET_ABILITY.NONE:
        return null;
      default:
        console.log("WARNING: maybe the target is not supported yet");
        return undefined;
    }
  }

  // Get the aftermath obj from id and type, empty if no aftermath found
  getAftermath(aftermathId: number, aftermathType: AftermathType) {
    if (aftermathType == "RULE")
      return rules.find(rule => rule.id === aftermathId) as Rule;
    else if (aftermathType == "MODIFIER")
      return modifiers.find(modifier => modifier.id === aftermathId) as Modifier;
    console.log("Error: aftermath type not supported yet");
    return undefined;
  }

  // Get the value for the effect on effectsValue on ability, -1 if empty
  getAftermathValue(effectId: number, effectsValue: EffectValue[]) {
    let effectValue = effectsValue.find((effectValue) => effectValue.id === effectId);

    if (effectValue == undefined) {
      console.log(`Error: effectValue not found for effectId ${effectId}`);
      return -1;
    }
    return effectValue.value;
  }

  // return the list of effect on the ability
  getEffectsOnAbility() {
    let effectOnAbility: Effect[] = [];

    for (let effectId of this.ability.effects) {
      let effect = effects.find(elem => elem.id == effectId);
      if (effect)
        effectOnAbility.push(effect as Effect);
    }
    return effectOnAbility;
  }

  // Check if the ability of action contain a specific rule
  isRulePresent(ruleId: number) {
    let effectOnAbility = this.getEffectsOnAbility();

    if (!effectOnAbility || effectOnAbility.length == 0)
      return false;
    return effectOnAbility.findIndex(effect => effect.aftermathType === "RULE" && effect.aftermathId === ruleId) != -1;
  }

  // Check if the ability of action contain a specific modifier
  isModifierPresent(modifierId: number) {
    let effectOnAbility = this.getEffectsOnAbility();

    if (effectOnAbility.length == 0)
      return false;
    return effectOnAbility.findIndex(effect => effect.aftermathType === "MODIFIER" && effect.aftermathId === modifierId) != -1;
  }

  // Return a 0 if ability is normal, 1 if ability should play first
  getSpeedRule() {
    if (this.isRulePresent(9))
      return 1;
    return 0;
  }
}