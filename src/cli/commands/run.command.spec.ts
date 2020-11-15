import 'mocha';
import * as sinon from "sinon";
import * as fs from 'fs';
import { expect } from 'chai';
import { RunCommand } from './run.command';
import { mockDatabasePool } from '../../database.context.spec';

describe('RunCommand', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('name should equal "run"', () => {
    let command = new RunCommand();
    expect(command.name).to.equal("run");
  });

  it('Run should throw if no script provided', (done) => {
    let command = new RunCommand();
    command.run(null, "config.json").catch(_ => done());
  });

  it('Run should throw if no config file found', (done) => {
    let command = new RunCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(new Error("testing"));
    command.run("script.sql").catch(_ => done());
  });

  it('Run should throw if no script file found', (done) => {
    let command = new RunCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"cwd": "./scripts"}');
    readFileStub.onCall(1).yields(new Error("testing"));
    command.run("script.sql").catch(_ => done());
  });

  it('Run should return empty promise', (done) => {
    mockDatabasePool(sandbox);
    let command = new RunCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"cwd": null}');
    readFileStub.onCall(1).yields(null, "placeholder");
    command.run("script.sql").then(_ => done());
  });

});