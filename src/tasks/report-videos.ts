/**
 * @file report-videos.ts
 *
 * Queries all videos accessible to the given key.
 */

import chalk from 'chalk';

import path from 'path';
import fs from 'fs';

import { StreamTask } from '.';

interface VideoReportRow {
  id: string;
  created: string;
  modified: string;
  watch: string;
  liveInput: string | false,
}

export class RVIDEOS extends StreamTask {
  name = 'Video Report';
  description = 'Queries all videos accessible to the given key.';
  type = 'report';

  async execute() {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const videos: any[] = [];
    let count = -1;
    const limit = 50;

    // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
    while (count === -1 || videos.length < count) {
      console.log(
        `Fetching videos ${videos.length} through ${videos.length + limit}`
      );

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

    console.log(chalk.blue(`Fetched ${videos.length} videos.`));

    const report: VideoReportRow[] = [];

    for (const video of videos) {
      // Make my spreadsheet row.
      report.push({
        id: video.uid,
        created: video.created,
        modified: video.modified,
        watch: video.preview,
        liveInput: video.liveInput || false,
      });
    }

    console.log(report);
    // const csvText = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    // fs.writeFileSync(path.join(process.cwd(), '/output/RTYPES.csv'), csvText);

    return true;
  }
}
