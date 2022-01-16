import * as _path from 'path';
import * as _fs from 'fs';
import * as _password from 'password-generator';
import { PoolConfig } from 'mysql';

import { ICommand } from "./command";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';
import { IDatabaseService } from '../../services/database.service';

export class BuildCommand implements ICommand {

  get name(): string { return "build"; }

  constructor(private databaseServiceFactory: (config: PoolConfig, scope: string) => IDatabaseService) {

  }

  run = (databaseName: string, user: string, configPath: string = "mysql-shaman.json"): Promise<void> => {
    if (!databaseName) return Promise.reject(new Error("Database name parameter not provided."));
    if (!user) return Promise.reject(new Error("User name parameter not provided."));
    let fullConfigPath = _path.join(process.cwd(), configPath);
    let buildCommand = this.getConfig(fullConfigPath).then(config => {
      if (!config.adminPoolConfig) throw new Error("No admin pool config found.");
      let scope = config.remote ? '%' : 'localhost';
      let databaseService = this.databaseServiceFactory(config.adminPoolConfig, scope);
      let password = _password(12, false);  
      return databaseService.buildDatabase(databaseName, user, password).then(_ => (password));
    });
    return buildCommand.then(password => {
      console.log('Database build complete.');
      console.log(`Default user: ${user}`);
      console.log(`Default password: ${password}`);
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

}