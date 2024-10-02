import { Ability } from "../@types/Ability";
import { Monster, MonsterDataFromDB } from "../@types/Entity";
import AbilityManager from "./AbilityManager";
import { fetchFromDB } from "../utils";


class MonsterManager {
  monsters: Monster[];
  abilityManager: AbilityManager;

  constructor() {
    this.monsters = [];
    this.abilityManager = null;
  }

  async init(abilityManager: AbilityManager) {
    this.abilityManager = abilityManager;
    this.abilityManager.init();
    const monstersData: MonsterDataFromDB[] = await fetchFromDB("monsters");
    if (!monstersData) {
      console.error("Error: fetching the data for the monsters from the DB failed.");
      return;
    }
    monstersData.forEach(monsterData => {
      let monsterAbilities: Ability[] = [];
      monsterData.abilities.forEach(abilityId => {
        let realAbility = this.abilityManager.abilities.find(ability => ability.id === abilityId);
        if (realAbility)
          monsterAbilities.push(realAbility);
        else
          console.log("Error: a monster data id doesn't have a supported ability:", abilityId);
      });
      this.monsters.push(new Monster({
        id: monsterData.id,
        name: monsterData.name,
        image: monsterData.image,
        description: monsterData.description,
        difficulty: monsterData.difficulty,
        level: monsterData.level,
        health: monsterData.health,
        speed: monsterData.speed,
        mind: monsterData.mind,
        sharpDmg: monsterData.sharpDmg,
        bluntDmg: monsterData.bluntDmg,
        burnDmg: monsterData.burnDmg,
        sharpRes: monsterData.sharpRes,
        bluntRes: monsterData.bluntRes,
        burnRes: monsterData.burnRes,
        handling: monsterData.handling,
        pierce: monsterData.pierce,
        guard: monsterData.guard,
        lethality: monsterData.lethality,
        stage: 1,
        abilities: monsterAbilities
      }));
    });
    console.log(`Monster Manager initialised, ${this.monsters.length} monsters.`);
  }
}

export default MonsterManager;