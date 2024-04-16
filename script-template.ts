/**
 * This is an example for how to use functions in this project to run bulk
 * operations or string together something specific that isn't directly supported
 * in the menu.
 *
 * Then execute with `npx ts-node FILE.ts`
 */
import 'dotenv/config';
import chalk from 'chalk';

// @TODO: Can we just import _everything_ and make it easy?
import { setVodCreator } from './src/util/vod';

if (!process.env.CF_STREAM_KEY || !process.env.CF_ACCT_TAG) {
  console.log(chalk.red('Missing API Key or Account Tag, check .env'));
  process.exit();
}

// EXAMPLE: Setting Creator ID on a bunch of videos:
const set = [
  ['f7396f8edbd3881868b0cc57582093e5',	'tsmith.com'],
  ['95420d626fe65692db7a9bc9d9c79141',	'tsmith.com'],
  ['9b082184821742572359a0cadb826c24',	'tsmith.com'],
];

(async function(){
  for (const pair of set) {
    console.log(`Updating ${pair[0]} to ${pair[1]}\n`);
    await setVodCreator(pair[0], pair[1]);
  }
})();
