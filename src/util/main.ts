import chalk from 'chalk';
import { deleteVodVideo, getVodSignedURL, getVodVideo, getVodVideos, makeVodClip, setVodMP4, setVodSignedURL } from './vod';
import { createLiveInput, deleteLiveInput, getLiveInput, getLiveInputs, purgeLiveInput } from './live';
import { format } from './output';
import cliSelect from 'cli-select';
import prompts from 'prompts';

export const menuVod = async (): Promise<void> => {
  await cliSelect({
    values: {
      'lookup': 'Get Video',
      'list': 'List Videos',
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
    } else if (op.id === 'list') {
      const creator = await prompts({
        type: 'text',
        name: 'creator',
        message: 'Search by creator ID? (blank for no)',
      });

      let videos;

      if (creator.creator) {
        videos = await getVodVideos('creator', creator.creator);
      } else {
        videos = await getVodVideos();
      }

      let uid = null;

      // This paginator situation is hacky since cli-select doesn't seem to
      // include a way to do it natively.
      for (let i = 0; i < videos.length; i += 10) {
        const start = i;
        let end = start + 10;
        let final = 'Next';

        if (end > videos.length) {
          end = videos.length;
          final = 'Exit';
        }

        const thisBatch = videos.slice(start, end);
        thisBatch.push(final);

        uid = await cliSelect({
          values:
            thisBatch
              .map(video =>
                (typeof video === 'string')
                ? video
                : `${video.uid}: ${video.meta.name} ${video.creator ? '(' + video.creator + ')' : ''}`),
          valueRenderer: (value, selected) => (selected) ? chalk.underline(value) : value,
        }).then(async (v) => {
          // Type safety: we're using arrays (so index will be a number) but this
          // library does support doing other things.
          const id = v.id as number;
          console.log(`--> ${v.value}`);

          if (thisBatch?.[id]?.uid) {
            return thisBatch[id].uid;
          }
          return null;
        });

        if (uid) {
          break;
        }
      }
      if (uid) {
        await menuVodSingle(uid);
      }
      return true;
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
          const response = await getVodVideos('live', id);
          format(response.map((r) => [r.uid, r.meta?.name]));
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
        'clip': 'Create Clip from Video',
        'delete': 'Delete Video',
        'signed': 'Set Signed URL requirement',
        'token': 'Get Signed URL for playback',
        'mp4': 'MP4 Downloads',
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
        case 'clip':
            await makeVodClip(id).then((x) => {
              if (x) {
                console.log(`Clip created: ${x}`);
              } else {
                console.log(`Creating clip failed.`);
              }
            });
          break;
          case 'delete':
          await deleteVodVideo(id);
          return false;
          break;
        case 'signed':
          await setVodSignedURL(id);
          break;
        case 'token':
          await getVodSignedURL(id);
          break;
          break;
        case 'mp4':
          await setVodMP4(id);
          break;
        case 'exit':
          return false;
          break;
      }
      return true;
    });
  }
};
