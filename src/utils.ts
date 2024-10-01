
const DB_URL = process.env.PUBLIC_DB_URL;

/**
 * Retreive data from the db, return undefined if an error occured
 * @param route Route in the DB you want the data
 * @returns The data from the DB or undefined
 */ 
export async function fetchFromDB(route: string) {
  try {
    let response = await fetch(`${DB_URL}/${route}`);
    if (!response.ok) {
      console.log(`An error occurred: ${response.statusText}`);
      return undefined;
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

/**
 * Create a deep copy of an element (do not copy methods of a classe)
 * @param obj Object you want to copy
 * @returns A new copy of the object
 */
export function deepCopy<Type>(obj: Type) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get the specify element from the arr1, remove it and add it in arr2
 * @param arr1 List of element source
 * @param arr2 List of element destination
 * @param element Element you want to move
 * @returns true on success, false otherwise
 */
export function getFromArrayToArray<Type>(arr1: Type[], arr2: Type[], element: Type) {
  const index = arr1.indexOf(element);

  if (index != -1) {
    arr2.push(element);
    arr1.splice(index, 1);
    return true;
  }
  console.log("Error: getFromArrayToArray on element that doesn't exist in array.");
  return false;
}

/**
 * Generate a random num between 0 and the parameter given
 * @param max The maximum limit
 * @returns the number generated
 */
export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

/**
 * Generate a random num between the two parameters given
 * @param min The minimum limit
 * @param max The maximum limit
 * @returns the number generated
 */
// min and max included 
export function randomIntFromInterval(min: number, max: number) { 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
