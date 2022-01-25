import * as _path from 'path';
import * as _fs from 'fs';
import * as _password from 'password-generator';
import { Interface } from 'readline';
import { PoolConfig } from 'mysql';

import { ICommand } from "./command";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';
import { IDatabaseService } from '../../services/database.service';

export class AddUserCommand implements ICommand {

  get name(): string { return "adduser"; }

  constructor(
    private passwordInputFactory: () => Interface,
    private databaseServiceFactory: (config: PoolConfig, scope: string) => IDatabaseService) {
      
  }

  run = (user: string, configPath: string = "mysql-shaman.json"): Promise<void> => {
    if (!user) return Promise.reject(new Error("User name parameter not provided."));
    let fullConfigPath = _path.join(process.cwd(), configPath);
    let getDatabaseService = this.getConfig(fullConfigPath).then(config => {
      if (!config.adminPoolConfig) throw new Error("No admin pool config found.");
      let scope = config.remote ? '%' : 'localhost';
      return this.databaseServiceFactory(config.adminPoolConfig, scope);
    });
    return getDatabaseService
      .then(databaseService => this.getPassword().then(pwd => databaseService.addUser(user, pwd)))
      .then(_ => console.log("\r\nDatabase user has been added (dont forget to grant permissions)."));
  }

  private getConfig = (path: string): Promise<MySqlShamanConfig> => {
    return new Promise((res, err) => {
      _fs.readFile(path, "utf-8", (ex, data) => {
        if (ex) return err(ex);
        res(JSON.parse(data));
      });
    });
  }

  private getPassword = (): Promise<string> => {
    let passwordInput = this.passwordInputFactory();
    return this.promptPassword(passwordInput).then(pwd => {
      return this.promptConfirmPassword(passwordInput).then(confirmPwd => {
        if (pwd != confirmPwd) throw new Error("Passwords do not match.");
        return pwd;
      })
    })
  }

  private promptPassword = (passwordInput: Interface): Promise<string> => {
    return new Promise((res) => {
      process.stdout.write("Please enter your password: ");
      passwordInput.question('', (pwd) => res(pwd));
    })
  }

  private promptConfirmPassword = (passwordInput: Interface): Promise<string> => {
    return new Promise((res) => {
      process.stdout.write("\r\nPlease confirm your password: ");
      passwordInput.question('', (pwd) => res(pwd));
    })
  }

}