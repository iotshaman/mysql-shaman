import * as _path from 'path';
import * as _fs from 'fs';
import { PoolOptions } from 'mysql2';

import { ICommand } from "./command";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';
import { IDatabaseService } from '../../services/database.service';

export class GrantCommand implements ICommand {

  get name(): string { return "grant"; }

  constructor(private databaseServiceFactory: (config: PoolOptions, scope: string) => IDatabaseService) {

  }

  run = (user: string, databaseName: string, role: string, configPath: string = "mysql-shaman.json"): Promise<void> => {
    if (!user) return Promise.reject(new Error("User name parameter not provided."));
    if (!databaseName) return Promise.reject(new Error("Database name parameter not provided."));
    if (!role) return Promise.reject(new Error("Role parameter not provided."));
    let fullConfigPath = _path.join(process.cwd(), configPath);
    let grantCommand = this.getConfig(fullConfigPath).then(config => {
      if (!config.adminPoolConfig) throw new Error("No admin pool config found.");
      let scope = config.remote ? '%' : 'localhost';
      let databaseService = this.databaseServiceFactory(config.adminPoolConfig, scope);
      return databaseService.grantUserPermissions(user, databaseName, role);
    });
    return grantCommand.then(_ => {
      console.log(`Permissions have been granted for user ${user} on ${databaseName}.`);
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