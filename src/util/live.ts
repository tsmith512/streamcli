import yesno from "yesno";
import { debug } from "./debug";
import chalk from "chalk";
import { deleteVodVideo, getVodVideos } from "./vod";

export interface liveInputDetails {
  id: string;
  title?: string;
  rtmpsKey?: string;
  rtmpsUrl?: string;
  srtPassphrase?: string;
  srtId?: string;
  srtUrl?: string;
  watch?: string;
  schedDel: number | null;
}

export const getLiveInput = async (id: string): Promise<liveInputDetails | false > => {
  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs/${id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
  });

  if (!response.ok) {
    debug('info', `HTTP ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();

  if (payload.success && payload.result?.uid) {
    return {
      id: payload.result.uid,
      title: payload.result?.meta?.name || 'undefined',
      rtmpsKey: payload.result?.rtmps?.streamKey || '',
      rtmpsUrl: payload.result?.rtmps?.url || '',
      srtPassphrase: payload.result?.srt?.passphrase || '',
      srtId: payload.result?.srt?.streamId || '',
      srtUrl: payload.result?.srt?.url || '',
      watch: `https://customer-igynxd2rwhmuoxw8.cloudflarestream.com/${payload.result.uid}/iframe`,
      schedDel: payload.result?.deleteRecordingAfterDays || null,
    };
  } else {
    return false;
  }
};

export const getLiveInputs = async (): Promise<any[]> => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const inputs: any[] = [];
  let count = -1;
  const limit = 50;

  // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
  while (count === -1 || inputs.length < count) {
    const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs`, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        // @TODO: Do some paging here if needed
      },
    });

    const theseInputs = await response.json() as any;

    // On first run, we need to set the count correctly.
    // @TODO: It should be in result_info but I don't see that in our response
    count = theseInputs.result.length;
    inputs.push(...theseInputs.result);
  }

  debug('info', `Fetched ${inputs.length} live inputs.`);

  const report = await Promise.all(inputs);

  return report;
};

export const createLiveInput = async (title: string): Promise<liveInputDetails | false> => {
  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
    body: JSON.stringify({
      meta: {
        name: title,
        createdBy: 'stream-hacks',
      },
      recording: {
        // @TODO: If I set this to "off" does all the live stuff still work, but it doesn't get retained??
        mode: 'automatic',
      }
    }),
  });

  const payload = await response.json();

  if (payload.success && payload.result?.uid) {
    return {
      id: payload.result.uid,
      title: payload.result?.meta?.name || 'undefined',
      rtmpsKey: payload.result?.rtmps?.streamKey || '',
      rtmpsUrl: payload.result?.rtmps?.url || '',
      srtPassphrase: payload.result?.srt?.passphrase || '',
      srtId: payload.result?.srt?.streamId || '',
      srtUrl: payload.result?.srt?.url || '',
      watch: `https://customer-igynxd2rwhmuoxw8.cloudflarestream.com/${payload.result.uid}/iframe?force-flavor=llhls&maxLiveSyncPlaybackRate=1.1`,
      schedDel: payload.result?.deleteRecordingAfterDays || null,
    };
  } else {
    return false;
  }
}

export const deleteLiveInput = async (id: string): Promise<boolean> => {
  const ok = await yesno({
    // @TODO: Would be cool to get its info...
    question: `${chalk.red('Really delete')} Live inputs? Cannot undo. (y/n)`,
    defaultValue: null,
  });

  if (!ok) {
    return false;
  }

  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
  });

  if (response.ok) {
    console.log(chalk.yellow(`Deleted ${id}`));
    return true;
  } else {
    console.log(chalk.red(`Failed to delete ${id}`));
    return false;
  }
};


export const purgeLiveInput = async (id: string): Promise<void> => {
  const ok = await yesno({
    // @TODO: Would be cool to get its info...
    question: `${chalk.red('Really purge')} LTV recordings on ${id}? Cannot undo. (y/n)`,
    defaultValue: null,
  });

  if (!ok) {
    return;
  }

  const recordings = await getVodVideos('live', id);

  for (const video in recordings) {
    await deleteVodVideo(recordings[video].uid, true);
  }
};
