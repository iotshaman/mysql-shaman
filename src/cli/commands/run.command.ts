import * as _path from 'path';
import * as _fs from 'fs';
import * as mysql from 'mysql';

import { ICommand } from "./command";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';
import { CreateConnection, RunMySqlQuery } from '../../mysql.functions';

export class RunCommand implements ICommand {

  get name(): string { return "run"; }

  run = (script: string, configPath: string = "mysql-shaman.json"): Promise<void> => {
    if (!script) return Promise.reject("Script parameter not provided.");
    let fullConfigPath = _path.join(process.cwd(), configPath);
    return this.getConfig(fullConfigPath).then(config => {
      let filePath = _path.join(process.cwd(), config.cwd || "", script);
      return this.getFileContents(filePath)
        .then(contents => this.runScript(config, contents));
    });
  }

  private getConfig = (path: string): Promise<MySqlShamanConfig> => {
    return new Promise((res, err) => {
      _fs.readFile(path, "utf-8", (ex, data) => {
        if (ex) return err(ex);
        res(JSON.parse(data));
      });
    });
  }

  private getFileContents = (path: string): Promise<string> => {
    return new Promise((res, err) => {
      _fs.readFile(path, "utf-8", (ex, contents) => {
        if (ex) return err(ex);
        res(contents);
      });
    });
  }

  private runScript = (config: MySqlShamanConfig, script: string): Promise<void> => {
    let pool = mysql.createPool(config.poolConfig);
    return CreateConnection(pool).then(conn => RunMySqlQuery(conn, script, []));
  }

}