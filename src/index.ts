import 'dotenv/config';
import chalk from 'chalk';
import { getVodVideos } from './util/vod';
import { createLiveInput, deleteLiveInput, getLiveInput } from './util/live';
import { format } from './util/output';
import cliSelect from 'cli-select';
import prompts from 'prompts';

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


cliSelect({
  values: {
    live: 'Live',
    vod: 'Video-on-Demand',
  },
  valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
}).then((key) => {
  switch (key.id) {
    case 'vod':
      getVodVideos().then(x => console.log(x));
      break;
    case 'live':
      cliSelect({
        values: {
          'lookup': 'Get Live Input',
          'create': 'Create New Live Input',
          'delete': 'Delete Live Input',
        },
        valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
      }).then(async (op) => {
        const response = await prompts({
          type: 'text',
          name: 'id',
          message: (op.id === 'create') ? 'Input name?' : 'Input ID?',
        });
        switch (op.id) {
          case 'lookup':
            await getLiveInput(response.id).then(x => format(x));
            break;
          case 'create':
            await createLiveInput(response.id).then(x => format(x));
            break;
          case 'delete':
            await deleteLiveInput(response.id);
            break;
        }
      });
      break;
    default:
      readme();
      break;
  }
});
