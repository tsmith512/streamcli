import chalk from 'chalk';
import { deleteVodVideo, getVodVideo, getVodVideos, updateVodSignedURL } from './vod';
import { createLiveInput, deleteLiveInput, getLiveInput, getLiveInputs, purgeLiveInput } from './live';
import { format } from './output';
import cliSelect from 'cli-select';
import prompts from 'prompts';
import yesno from 'yesno';
import { table } from 'table';
import { debug } from './debug';

export const menuVod = async (liveId?: string): Promise<void> => {
  await cliSelect({
    values: {
      'lookup': 'Get Video',
      'exit': 'Exit',
    },
    valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
  }).then(async (op) => {
    if (op.id === 'lookup') {
      const response = await prompts({
        type: 'text',
        name: 'id',
        message: 'Video ID?',
      });
      await menuVodSingle(response.id);
    } else if (op.id === 'exit') {
      return false;
    }
  })
};

export const menuLive = async (): Promise<void> => {
  await cliSelect({
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

export const menuVodSingle = async (id: string): Promise<void> => {
  let loop = true;

  // Show Video details
  while (loop) {
    loop = await cliSelect({
      values: {
        'show': 'Show Video details',
        'delete': 'Delete Video',
        'signed': 'Set Signed URL requirement',
        'exit': 'Exit',
      },
      valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
    }).then(async (op) => {
      switch (op.id) {
        case 'show':
          await getVodVideo(id).then(async (x) => {
            format(x);
          });
          break;
        case 'delete':
          await deleteVodVideo(id);
          return false;
          break;
        case 'signed':
          await updateVodSignedURL(id);
          break;
        case 'exit':
          return false;
          break;
      }
      return true;
    });
  }
};
