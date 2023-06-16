import 'dotenv/config';
import chalk from 'chalk';
import yesno from 'yesno';
import { getVodVideos } from './util/vod';

if (!process.env.CF_STREAM_KEY || !process.env.CF_ACCT_TAG) {
  console.log(chalk.red('Missing API Key or Account Tag, check .env'));
  process.exit();
}

const arg = process.argv[2] || false;

/**
 * Print usage information
 */
const readme = () => {
  console.log(`${chalk.blue('# Stream Hacks')}
Usage: npm run <command>

Supported commands:
  - Nothin' yet. Chill.`);
};

switch (arg) {
  case 'list':
    getVodVideos().then(x => console.log(x));
    break;
  default:
    readme();
    break;
}
