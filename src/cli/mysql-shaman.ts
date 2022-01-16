import { ICommand } from "./commands/command";
import { ScaffoldCommand } from "./commands/scaffold.command";
import { RunCommand } from "./commands/run.command";
import { BuildCommand } from "./commands/build.command";
import { PoolConfig } from "mysql";
import { DatabaseService } from "../services/database.service";
import { GrantCommand } from "./commands/grant.command";

export class MySqlShaman {

  constructor(private commands: ICommand[] = MySqlShamanCommands) { }

  RunCommand = (command: string, args: string[]): Promise<void> => {
    if (!command) throw new Error("Command parameter not provided.");
    let cmd = this.commands.find(c => c.name == command);
    if (!cmd) throw new Error(`Invalid command '${command}'.`)
    return cmd.run(...args);
  }

}

/* istanbul ignore next */
const MySqlShamanCommands: ICommand[] = [
  new ScaffoldCommand(),
  new RunCommand(),
  new BuildCommand((config: PoolConfig, scope: string) => new DatabaseService(config, scope)),
  new GrantCommand((config: PoolConfig, scope: string) => new DatabaseService(config, scope))
]