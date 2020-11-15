import * as _path from 'path';
import * as _fs from 'fs';
import { ICommand } from "./command";
import { ScaffoldService } from "../../scaffold/scaffold.service";
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';

export class ScaffoldCommand implements ICommand {

  get name(): string { return "scaffold"; }

  run = (configPath: string = "mysql-shaman.json"): Promise<void> => {
    let path = _path.join(process.cwd(), configPath);
    return this.getConfig(path).then(config => {
      config.cwd = _path.join(process.cwd(), config.cwd || "");
      let scaffoldService = new ScaffoldService(config);
      return scaffoldService.scaffoldDatabase();
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