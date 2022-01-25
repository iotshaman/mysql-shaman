import 'mocha';
import * as sinon from "sinon";
import * as fs from 'fs';
import { expect } from 'chai';

import { AddUserCommand } from './adduser.command';
import { IDatabaseService } from '../../services/database.service';

describe('Add User Command', () => {

  var sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('name should equal "adduser"', () => {
    let command = new AddUserCommand(() => (null), (_a, _b) => (null));
    expect(command.name).to.equal("adduser");
  });

  it('Run should throw if no user provided', (done) => {
    let command = new AddUserCommand(() => (null), (_a, _b) => (null));
    command.run(null, "config.json").catch(ex => {
      expect(ex.message).to.equal('User name parameter not provided.');
      done();
    });
  });

  it('Run should throw if no config file not found', (done) => {
    let command = new AddUserCommand(() => (null), (_a, _b) => (null));
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.yields(new Error("testing"));
    command.run("testuser").catch(_ => done());
  });

  it('Run should throw if no admin pool config found', (done) => {
    let command = new AddUserCommand(() => (null), (_a, _b) => new MockDatabaseService());
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{}');
    command.run("testuser").catch(ex => {
      expect(ex.message).to.equal("No admin pool config found.");
      done();
    })
  });

  it('Run should throw if passwords do not match.', (done) => {
    sandbox.stub(process.stdout, 'write');
    let pwdInputMock = { question: sinon.stub() };
    pwdInputMock.question.onCall(0).yields("abc");
    pwdInputMock.question.onCall(1).yields("123");
    let command = new AddUserCommand(() => (<any>pwdInputMock), (_a, _b) => new MockDatabaseService());
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"adminPoolConfig": {}}');
    command.run("testuser").catch(ex => {
      sandbox.restore();
      expect(ex.message).to.equal("Passwords do not match.");
      done();
    })
  });

  it('Run should return resolved promise.', (done) => {
    sandbox.stub(process.stdout, 'write');
    let pwdInputMock = { question: sinon.stub() };
    pwdInputMock.question.onCall(0).yields("abc");
    pwdInputMock.question.onCall(1).yields("abc");
    let command = new AddUserCommand(() => (<any>pwdInputMock), (_a, _b) => new MockDatabaseService());
    let readFileStub = sandbox.stub(fs, 'readFile');
    readFileStub.onCall(0).yields(null, '{"adminPoolConfig": {}, "remote": true}');
    command.run("testuser").then(_ => done());
  });

});

class MockDatabaseService implements IDatabaseService {  

  buildDatabase = (_database: string, _user: string, _password: string): Promise<void> => {
    return Promise.reject(new Error("build database method should not be called"));
  }

  addUser = (_user: string, _password: string): Promise<void> => {
    return Promise.resolve();
  }

  grantUserPermissions = (_user: string, _database: string, _role: string): Promise<void> => {
    return Promise.reject(new Error("grant user permissions method should not be called"));
  }

}