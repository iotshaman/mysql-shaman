import * as _glob from 'fast-glob';
import * as _path from 'path';
import * as _fs from 'fs';
import * as mysql from 'mysql';

import { ICommand } from "./command";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';
import { PoolConnection } from 'mysql';
import { MysqlScript } from '../mysql-script';
import { CreateConnection, RunMySqlQuery } from '../../mysql.functions';

export class ScaffoldCommand implements ICommand {

  globService = _glob;
  private config: MySqlShamanConfig;

  get name(): string { return "scaffold"; }

  run = (configPath: string = "mysql-shaman.json"): Promise<void> => {
    let path = _path.join(process.cwd(), configPath);
    return this.getConfig(path).then(config => {
      config.cwd = _path.join(process.cwd(), config.cwd || "");
      this.config = config;
      return this.scaffoldDatabase();
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

  private scaffoldDatabase = (): Promise<void> => {
    if (!this.config.scripts || !this.config.scripts.tables){
      return Promise.reject("Scripts config must at least have table declarations.");
    }
    return this.executeScripts(this.config.scripts.tables, 'table')
      .then(_ => this.executeScripts(this.config.scripts.primers || [], 'primers'))
      .then(_ => this.executeScripts(this.config.scripts.views || [], 'views'))
      .then(_ => this.executeScripts(this.config.scripts.procedures || [], 'procedures'));
  }

  private executeScripts = (patterns: string[], type: string): Promise<void> => {
    return this.getFilesFromGlob(patterns)
      .then(files => this.getMysqlScripts(files, type))
      .then(scripts => {
        if (scripts.length == 0) {
          console.log(`No scripts found for script type '${type}'.`);
          return Promise.resolve();
        }
        let pool = mysql.createPool(this.config.poolConfig);
        return CreateConnection(pool).then(connection => {
          let operations = scripts.map(script => this.executeScript(connection, script));
          let taskChain = operations.reduce((a, b) => a.then(_ => b), Promise.resolve());
          return taskChain.then(_ => {connection.release()});
        });
      });
  }

  private getFilesFromGlob = (patterns: string[]): Promise<string[]> => {
    let options = { cwd: this.config.cwd };
    return this.globService(patterns, options).then((rslt: string[]) => {
      return rslt.map(file => _path.join(this.config.cwd, file))
    });
  }

  private getMysqlScripts = (files: string[], type: string): Promise<MysqlScript[]> => {
    let operations = files.map(file => {
      return this.getFileContents(file)
        .then(contents => new MysqlScript(type, file, contents));
    });
    return Promise.all(operations);
  }

  private getFileContents = (file: string): Promise<string> => {
    return new Promise((res, err) => {
      _fs.readFile(file, "utf-8", (ex, contents) => {
        if (ex) return err(ex);
        res(contents);
      });
    });
  }

  private executeScript = (connection: PoolConnection, script: MysqlScript): Promise<void> => {
    console.log(`Executing ${script.type} script: ${script.path}`);
    return RunMySqlQuery(connection, script.contents, null, false);
  }

}