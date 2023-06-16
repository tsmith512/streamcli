import chalk from 'chalk';

import path from 'path';
import fs from 'fs';

import { StreamTask } from '.';

export class createLLHLSgroup extends StreamTask {
  name = 'Create LL-HLS Test Group';
  description = 'Given a list of names, create named Live Inputs';
  type = 'task';

  async execute() {
    const input = fs.readFileSync(path.join(process.cwd(), '/input/LLHLSgroup.txt')).toString().trim();
    const group = input.split('\n').map((line: string) => line.trim());

    const report = group.map(async (tester) => {
      console.log(`Creating ${tester}`);

      const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        },
        body: JSON.stringify({
          meta: {
            name: `llhls-${tester}`,
            group: 'llhls-live-internal-test',
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
          label: tester,
          id: payload.result.uid,
          status: 'created',
          title: payload.result?.meta?.name || 'undefined',
          rtmpsKey: payload.result?.rtmps?.streamKey || '',
          rtmpsUrl: payload.result?.rtmps?.url || '',
          srtPassphrase: payload.result?.srt?.passphrase || '',
          srtId: payload.result?.srt?.streamId || '',
          srtUrl: payload.result?.srt?.url || '',
          watch: `https://customer-igynxd2rwhmuoxw8.cloudflarestream.com/${payload.result.uid}/iframe?force-flavor=llhls&maxLiveSyncPlaybackRate=1.1`,
        };
      } else {
        return {
          label: tester,
          status: 'errored',
        }
      }
    });

    const results = await Promise.all(report);

    const cols = ['label', 'id', 'status', 'title', 'rtmpsKey', 'rtmpsUrl', 'srtPassphrase', 'srtId', 'srtUrl', 'watch'];
    const csvText = [cols.join(','), ...results.map((row) => Object.values(row).join(','))].join('\n');
    fs.writeFileSync(path.join(process.cwd(), '/output/reportLLHLSgroup.csv'), csvText);

    return true;
  }
}
