import { Ability } from "./Ability";
import { Action } from "./Action"
import { Monster, Weapon } from "./Entity";
import { deepCopy } from "../utils";

export type Turn = {
  number: number,     // represent the turn number
  actions: Action[]   // represent the actions for this turn
};

export class HistoricSystem {
  constructor(public turns: Turn[]) {}

  // Make a deep copie of a new turn and add it.
  createTurn(newTurn: Turn) {
    this.turns.push(deepCopy(newTurn));
  }

  // Geet turn, can modifie the return turn
  getTurn(turnNumber: number) {
    const turnNeeded = this.turns.find(turn => turn.number === turnNumber);
    if (!turnNeeded)
      console.log(`Error: try to get turn ${turnNumber} from historic system but it doesn't exist.`);
    return turnNeeded;
  }

  // Return true if the specified entity acted during the specified turnNumber, false otherwise
  // If no turn is specified check in the all history
  hasAlreadyActed(entity: Weapon | Monster, turnNumber: number = 0) {
    let turnsToCheck: Turn[] = [];

    if (turnNumber < 1) {
      const specificTurn = this.turns.find(turn => turn.number === turnNumber);
      if (!specificTurn) {
        console.log(`Error: try to target turn ${turnNumber} in hasAlreadyActed but doesn't exist.`);
        return false;
      }
      turnsToCheck.push(specificTurn);
    } else {
      turnsToCheck = this.turns;
    }
    for (let i = 0; i < turnsToCheck.length; i++) {
      const turn = turnsToCheck[i];
      for (let y = 0; y < turn.actions.length; y++) {
        const action = turn.actions[y];
        if (action.caster.id === entity.id && action.hasBeenDone)
          return true;
      }
    }
    return false;
  }

  // Return true if the specified entity launched specify ability during the specified turnNumber, false otherwise
  // If no turn is specified check in the all history
  hasAlreadyLaunchedAbility(entity: Weapon | Monster, ability: Ability, turnNumber: number = 0) {
    let turnsToCheck: Turn[] = [];

    if (turnNumber < 1) {
      const specificTurn = this.turns.find(turn => turn.number === turnNumber);
      if (!specificTurn) {
        console.log(`Error: try to target turn ${turnNumber} in hasAlreadyActed but doesn't exist.`);
        return false;
      }
      turnsToCheck.push(specificTurn);
    } else {
      turnsToCheck = this.turns;
    }
    for (let i = 0; i < turnsToCheck.length; i++) {
      const turn = turnsToCheck[i];
      for (let y = 0; y < turn.actions.length; y++) {
        const action = turn.actions[y];
        if (action.caster.id === entity.id && action.ability.id === ability.id && action.hasBeenDone)
          return true;
      }
    }
    return false;
  }

  // Return true if the specified entity took damages during the specified turnNumber, false otherwise
  // If no turn is specified check in the all history
  tookDamages(entity: Weapon | Monster, turnNumber: number = 0) {
  }

};