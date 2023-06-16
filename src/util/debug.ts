import chalk from 'chalk';

type errorLevel = 'info' | 'warning' | 'error';

const levelMap = {
  info: chalk.gray,
  warning: chalk.yellow,
  error: chalk.red,
};

export const debug = (level: errorLevel, message: string): void => {
  if (process.env.debug || level === 'error') {
    console.log(levelMap[level](message));
  }
};
