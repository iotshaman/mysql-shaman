import * as readline from 'readline';
import { Interface } from 'readline';
import { Writable } from 'stream';

export function PasswordInputFactory(): Interface { 
  /* istanbul ignore next */
  return readline.createInterface({
    input: process.stdin,
    output: new Writable({
      write: (_chunk, _encoding, callback) => callback()
    }),
    terminal: true
  });
}
