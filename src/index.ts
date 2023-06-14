import 'dotenv/config';

import chalk from 'chalk';

import * as tasks from './tasks';

if (!process.env.CF_STREAM_KEY) {
  console.log(chalk.red('Missing API Key'));
  process.exit();
}

const arg = process.argv[2] || false;

console.log(chalk.gray('Testing Contentful Delivery API Access'));

// If we don't have a task to run, print the index.
if (!arg) {
  console.log(chalk.red('What do you want to do? Missing task argument.'));

  for (const className in tasks) {
    if (['ContentfulTask', 'ContentfulTaskType'].includes(className)) {
      continue;
    }

    const taskClass = tasks[
      className as unknown as keyof typeof tasks
    ] as tasks.StreamTaskType;
    const task = new taskClass();

    console.log(chalk.yellow(className));
    task.getInfo();
  }
}

// Load and run the named task
else if (typeof arg === 'string' && arg in tasks) {
  const taskClass = tasks[
    arg as unknown as keyof typeof tasks
  ] as tasks.ContentfulTaskType;
  const task = new taskClass();
  task.getInfo();

  task.execute().then((success) => {
    if (success) {
      console.log(chalk.green('Success!'));
    } else {
      console.log(chalk.red('Failed.'));
    }
  });
}

// Catch-all for name not in task import
else {
  console.log(chalk.red(`Could not find task "${arg}"`));
}
