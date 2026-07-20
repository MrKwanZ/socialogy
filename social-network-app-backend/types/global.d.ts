import { Application } from 'express';

declare global {
  // eslint-disable-next-line no-var
  var app: Application;
}

export {};
