import { Ability } from "../@types/Ability";
import { Monster, MonsterDataFromDB, SerialisedEntityData, Weapon, WeaponData } from "../@types/Entity";
import AbilityManager from "./AbilityManager";
import { fetchFromDB } from "../utils";


class WeaponManager {
  abilityManager: AbilityManager;

  constructor() {
    this.abilityManager = null;
  }

  async init(abilityManager: AbilityManager) {
    this.abilityManager = abilityManager;
    await this.abilityManager.init();
    console.log(`Weapon Manager initialised.`);
  }

  /**
   * Create a weapon from the serialised data
   * @param data Serialised entity data of the weapon to create
   * @returns a copy of the created Weapon
   */
  ceateWeapon(data: SerialisedEntityData): Weapon {
    let abilities: Ability[] = data.abilities.map(abilityId => {
      return this.abilityManager.getAbility(abilityId)
    });
    return new Weapon({...data, abilities: abilities});
  }
}

export default WeaponManager;