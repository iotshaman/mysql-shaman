import { ICommand } from "./commands/command";
import { ScaffoldCommand } from "./commands/scaffold.command";
import { RunCommand } from "./commands/run.command";

export class MySqlShaman {

  constructor(private commands: ICommand[] = MySqlShamanCommands) { }

  RunCommand = (command: string, args: string[]): Promise<void> => {
    if (!command) throw new Error("Command parameter not provided.");
    let cmd = this.commands.find(c => c.name == command);
    if (!cmd) throw new Error(`Invalid command '${command}'.`)
    return cmd.run(...args);
  }

}

const MySqlShamanCommands: ICommand[] = [
  new ScaffoldCommand(),
  new RunCommand()
]