import { debug } from "./debug";


/**
 * Get a list of all videos in the account.
 *
 * @returns (any[]) array of VOD Videos (will include saved Lives)
 */
export const getVodVideos = async () => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const videos: any[] = [];
  let count = -1;
  const limit = 50;

  // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
  while (count === -1 || videos.length < count) {
    const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream`, {
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
