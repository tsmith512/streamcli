import chalk from 'chalk';
import yesno from 'yesno';
import path from 'path';
import fs from 'fs';

import { StreamTask } from '.';

export class deleteLiveInputs extends StreamTask {
  name = 'Delete Live Inputs';
  description = 'Given a list of Live Input IDs, delete them';
  type = 'task';

  async execute() {
    const input = fs.readFileSync(path.join(process.cwd(), '/input/input.txt')).toString().trim();
    const group = input.split('\n').map((line: string) => line.trim());

    const ok = await yesno({
      question: `${chalk.red('Really delete')} ${group.length} live inputs? Cannot undo. (y/n)`,
      defaultValue: null,
    });

    if (!ok) {
      process.exit();
    }

    await Promise.all(group.map(async (id) => {
      console.log(`Deleting ${id}`);

      const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        },
      });

      if (response.ok) {
        console.log(chalk.yellow(`Deleted ${id}`));
      } else {
        console.log(chalk.red(`Failed to delete ${id}`));
      }

      return response;
    }));

    return true;
  }
}
