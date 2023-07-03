import { table } from "table";
import { debug } from "./debug";

type formatInput = false | Record<string, string | number | boolean | null | undefined>;

export const format = (input: formatInput): void => {
  if (input === false) {
    debug('info', 'No data');
  } else {
    console.log(table(Object.entries(input)));
  }
}
