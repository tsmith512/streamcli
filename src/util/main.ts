import chalk from 'chalk';
import { getVodVideos } from './vod';
import { createLiveInput, deleteLiveInput, getLiveInput, getLiveInputs, purgeLiveInput } from './live';
import { format } from './output';
import cliSelect from 'cli-select';
import prompts from 'prompts';
import yesno from 'yesno';
import { table } from 'table';
import { debug } from './debug';

export const menuVod = async (liveId?: string): Promise<any[]> => {
  await getVodVideos(liveId).then(async (results) => {
    if (results.length) {
      console.log(table([
        ['Video ID', 'Title'],
        ...results.map(r => [r.uid, r.meta?.name || ''])
      ]));

      return results;
    } else {
      debug('info', 'No videos found.');
    }
  });

  return  [];
};

export const menuLive = async (): Promise<void> => {
  cliSelect({
    values: {
      'list': 'List all Live Inputs',
      'lookup': 'Get Live Input',
      'create': 'Create New Live Input',
      'exit': 'Exit'
    },
    valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
  }).then(async (op) => {
    if (op.id === 'list') {
      const inputs = await getLiveInputs();
      console.log(inputs);
      await cliSelect({
        values: inputs.map(input => `${input.uid}: ${input.meta.name}`),
        valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
      }).then(async (input) => {
        // @ts-ignore
        await menuLiveSingle(inputs[input.id].uid);
      });
    } else if (op.id === 'create') {
      const response = await prompts({
        type: 'text',
        name: 'id',
        message: 'Input name?',
      });
      await createLiveInput(response.id).then(x => format(x));
    } else if (op.id === 'lookup') {
      const response = await prompts({
        type: 'text',
        name: 'id',
        message: 'Input ID?',
      });
      await menuLiveSingle(response.id);
    } else if (op.id === 'exit') {
      return false;
    }

    return true;
  }).then((loop) => {
    if (loop) {
      menuLive();
    }
  });
};

export const menuLiveSingle = async (id: string): Promise<void> => {
  let loop = true;

  // Show Live Input details
  while (loop) {
    loop = await cliSelect({
      values: {
        'show': 'Show Live Input details',
        'delete': 'Delete Live Input',
        'list': 'List LTV recorings',
        'purge': 'Purge LTV recordings',
        'exit': '<-- Go Back',
      },
      valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
    }).then(async (op) => {
      switch (op.id) {
        case 'show':
          await getLiveInput(id).then(async (x) => {
            format(x);
          });
          return true;
          break;
        case 'list':
          await menuVod(id);
          return true;
          break;
        case 'delete':
          await deleteLiveInput(id);
          return false;
          break;
        case 'purge':
          await purgeLiveInput(id);
          return true;
          break;
        case 'exit':
          return false;
          break;
      }
      return true;
    });
  }
};
