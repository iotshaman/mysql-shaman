import 'mocha';
import { expect } from 'chai';
import { MySqlShaman } from './mysql-shaman';
import { ICommand } from './commands/command';

describe('MySqlShaman', () => {

  it('should be created', () => {
    let factory = new MySqlShaman();
    expect(factory).not.to.be.null;
  })

  it('RunCommand should throw if no command provided', () => {
    let factory = new MySqlShaman([new MockCommand()]);
    let msg = "Command parameter not provided.";
    expect(() => factory.RunCommand('', [])).to.throw(msg);
  });

  it('RunCommand should throw if invalid command', () => {
    let factory = new MySqlShaman([new MockCommand()]);
    let msg = "Invalid command 'invalid'.";
    expect(() => factory.RunCommand("invalid", [])).to.throw(msg);
  });

  it('RunCommand should return resolved promise', (done) => {
    let factory = new MySqlShaman([new MockCommand()]);
    factory.RunCommand("mock", []).then(done);
  });

})

class MockCommand implements ICommand {
  name: string = 'mock';
  run(arg: string) {
    return Promise.resolve();
  }
}