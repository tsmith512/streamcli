import chalk from 'chalk';

export type StreamTaskType = {
  name: string;
  description: string;
  type: 'task' | 'report';
  getInfo: () => void;
  execute: () => boolean;
  new (): StreamTask;
};

export abstract class StreamTask {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly type: string;

  constructor() {
    return this;
  }

  abstract execute(): Promise<boolean>;

  getInfo() {
    console.log(`${this.type.toUpperCase()}: ` + chalk.blue(this.name));
    console.log(chalk.gray(this.description) + '\n');

    return this;
  }
}

export { reportVideos } from './reportVideos';
