import chalk from "chalk";
import { debug } from "./debug";
import yesno from "yesno";


/**
 * Get a list of all videos in the account.
 *
 * @returns (any[]) array of VOD Videos (will include saved Lives)
 */
export const getVodVideos = async (liveId?: string): Promise<any[]> => {
  let url = `${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream`;

  // If we got a Live Input ID it means we are looking for LTV recordings off
  // that ID specifically.
  if (liveId) {
    url += `/live_inputs/${liveId}/videos`;
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const videos: any[] = [];
  let count = -1;
  const limit = 50;

  // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
  while (count === -1 || videos.length < count) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        // @TODO: Do some paging here if needed
      },
    });

    const theseVideos = await response.json() as any;

    // On first run, we need to set the count correctly.
    count = theseVideos.result.length;
    videos.push(...theseVideos.result);
  }

  debug('info', `Fetched ${videos.length} videos.`)
  const report = await Promise.all(videos);
  return report;
};

export const deleteVodVideo = async (id: string, confirmed = false): Promise<boolean> => {
  const ok = confirmed || await yesno({
    question: `${chalk.red('Really delete')} video? Cannot undo. (y/n)`,
    defaultValue: null,
  });

  if (!ok) {
    return false;
  }

  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/${id}`, {
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
