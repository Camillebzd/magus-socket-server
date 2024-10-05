import { Ability, AbilityFromDB } from "../@types/Ability";
import { fetchFromDB } from "../utils";

/**
 * Manager for the abilities
 */
class AbilityManager {
  hasBeenInit: boolean;
  abilities: Ability[];

  constructor() {
    this.hasBeenInit = false;
    this.abilities = [];
  }

  /**
   * Initialise the manager by calling the DB and creating 
   * all the ability classes from the data. This will init
   * only on the first call otherwise do nothing.
   */
  async init() {
    if (this.hasBeenInit)
      return;

    const abilitiesData: AbilityFromDB[] = await fetchFromDB("abilities/abilities");

    if (!abilitiesData) {
      console.error("Error: fetching the data for the abilities from the DB failed.");
      return;
    }
    abilitiesData.forEach(abilityData => this.abilities.push(new Ability(abilityData)));
    this.hasBeenInit = true;
    console.log(`Monster Manager initialised, ${this.abilities.length} abilities.`);
  }
  
  /**
   * Get an ability using his id
   * @param id Id of the ability
   * @returns a copy of the ability if the id match one, undefined otherwise 
   */
  getAbility(id: number): Ability | undefined {
    const ability = this.abilities.find(ability => ability.id == id);

    return ability ? ability.clone() : undefined;
  }
}

export default AbilityManager;