import 'dotenv/config';
import chalk from 'chalk';
import cliSelect from 'cli-select';
import { menuLive, menuVod } from './util/main';

if (!process.env.CF_STREAM_KEY || !process.env.CF_ACCT_TAG) {
  console.log(chalk.red('Missing API Key or Account Tag, check .env'));
  process.exit();
}

cliSelect({
  values: {
    live: 'Live',
    vod: 'Video-on-Demand',
  },
  valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
}).then((key) => {
  switch (key.id) {
    case 'vod':
      menuVod();
      break;
    case 'live':
      menuLive();
      break;
    case 'exit':
      return false;
  }
});
