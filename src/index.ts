import 'dotenv/config';
import chalk from 'chalk';
import yesno from 'yesno';
import { getVodVideos } from './util/vod';
import { createLiveInput, deleteLiveInput } from './util/live';

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
  case 'live':
    if (process.argv[3] == 'create') {
      createLiveInput(process.argv[4]).then(x => console.log(x));
    } else if (process.argv[3] == 'delete') {
      deleteLiveInput(process.argv[4]);
    }
    break;
  default:
    readme();
    break;
}
