import 'mocha';
import * as sinon from "sinon";
import * as fs from 'fs';
import { expect } from 'chai';

import { BuildCommand } from './build.command';
import { IDatabaseService } from '../../services/database.service';

describe('Build Command', () => {

  var sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('name should equal "build"', () => {
    let command = new BuildCommand(_ => (null));
    expect(command.name).to.equal("build");
  });

  it('Run should throw if no database name provided', (done) => {
    let command = new BuildCommand(_ => (null));
    command.run(null, "testuser", "config.json").catch(ex => {
      expect(ex.message).to.equal('Database name parameter not provided.');
      done();
    });
  });

  it('Run should throw if no user provided', (done) => {
    let command = new BuildCommand(_ => (null));
    command.run("sample", null, "config.json").catch(ex => {
      expect(ex.message).to.equal('User name parameter not provided.');
      done();
    });
  });

  it('Run should throw if no config file not found', (done) => {
    let command = new BuildCommand(_ => (null));
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(new Error("testing"));
    command.run("sample", "testuser").catch(_ => done());
  });

  it('Run should throw if no admin pool config found', (done) => {
    let command = new BuildCommand(_ => new MockDatabaseService());
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{}');
    readFileStub.onCall(1).yields(new Error("testing"));
    command.run("sample", "testuser").catch(ex => {
      expect(ex.message).to.equal("No admin pool config found.");
      done();
    })
  });

  it('Run should return resolved promise', (done) => {
    let command = new BuildCommand(_ => new MockDatabaseService());
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"adminPoolConfig": {}}');
    readFileStub.onCall(1).yields(new Error("testing"));
    command.run("sample", "testuser").then(_ => done());
  });

});

class MockDatabaseService implements IDatabaseService {  

  buildDatabase = (_database: string, _user: string, _password: string): Promise<void> => {
    return Promise.resolve();
  }
}