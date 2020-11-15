import 'mocha';
import * as sinon from "sinon";
import * as fs from 'fs';
import { expect } from 'chai';
import { ScaffoldCommand } from './scaffold.command';
import { mockDatabasePool } from '../../database.context.spec';
import { MySqlShamanConfig } from '../mysql-shaman-cli.config';

describe('ScaffoldCommand', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('name should equal "scaffold"', () => {
    let command = new ScaffoldCommand();
    expect(command.name).to.equal("scaffold");
  });

  it('Run should throw if no config file found', (done) => {
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(new Error("testing"));
    command.run("config.json").catch(_ => done());
  });

  it('Run should throw if no scripts configured', (done) => {
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(null, '{}');
    command.run().catch(_ => done());
  });

  it('Run should throw if no table scripts configured', (done) => {
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(null, '{"scripts": {}}');
    command.run().catch(_ => done());
  });

  it('Run should throw if no scripts found', (done) => {
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"scripts": {"tables": ["*"]}}');
    sandbox.stub(command, 'globService').returns(Promise.resolve([]));
    command.run().catch(_ => done());
  });

  it('Run should throw if script cannot be read', (done) => {
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"scripts": {"tables": ["*"]}}');
    readFileStub.onCall(1).yields(new Error("testing"));
    sandbox.stub(command, 'globService').returns(Promise.resolve(["script.sql"]));
    command.run().catch(_ => done());
  });

  it('Run should return empty promise for table scripts', (done) => {
    mockDatabasePool(sandbox);
    let command = new ScaffoldCommand();
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"scripts": {"tables": ["*"]}}');
    readFileStub.yields(null, 'placeholder');
    sandbox.stub(command, 'globService').returns(Promise.resolve(["script.sql"]));
    command.run().then(_ => done());
  });

  it('Run should return empty promise for all scripts', (done) => {
    mockDatabasePool(sandbox);
    let command = new ScaffoldCommand();
    let config: MySqlShamanConfig = {
      poolConfig: {},
      scripts: { tables: ["*"], primers: ["*"], views: ["*"], procedures: ["*"] }
    };
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, JSON.stringify(config));
    readFileStub.yields(null, 'placeholder');
    sandbox.stub(command, 'globService').returns(Promise.resolve(["script.sql"]));
    command.run().then(_ => done());
  });

});