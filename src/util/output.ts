import { table } from "table";
import { debug } from "./debug";

// @TODO: This is not how to do this but I'm in a hurry
type formatInput = false | Object;

export const format = (input: formatInput): void => {
  if (input === false) {
    debug('info', 'No data');
  } else {
    console.log(table(Object.entries(input)));
  }
}
