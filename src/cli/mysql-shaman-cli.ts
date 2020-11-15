#!/usr/bin/env node
import { MySqlShaman } from './mysql-shaman';

/* istanbul ignore next */
(function() {
  if (process.argv.length < 3) throw new Error("Invalid number of arguments.");
  const factory = new MySqlShaman();
  const [command] = process.argv.slice(2);
  factory.RunCommand(command, process.argv.slice(3))
    .then(_ => { process.exit(0); })
    .catch(ex => {
      console.error(ex);
      process.exit(1);
    });
})();