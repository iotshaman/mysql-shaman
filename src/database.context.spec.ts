import 'mocha';
import * as mysql from 'mysql2';
import * as sinon from "sinon";
import { expect } from 'chai';
import { DatabaseContext } from './database.context';
import { Collection } from './collection';

describe('DatabaseContext', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('initialize should load models', () => {
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    expect(subject.models.foo).not.to.be.null;
  });

  it('query should return void promise', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleQuery().then(_ => done());
  });

  it('callProcedure should return void promise', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleProcedure(['a', 'b']).then(_ => done());
  });

  it('callProcedure should return void promise in transaction scope', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.beginTransaction().then(_ => {
      subject.sampleProcedure(['a', 'b']).then(_ => done());
    }).catch(console.dir);
  });

  it('beginTransaction should throw is unable to create connection', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.sampleBeginTransaction().catch(_ => done());
  });

  it('beginTransaction should return void promise', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction().then(_ => done());
  });

  it('beginTransaction should throw is sql transaction throws', (done) => {
    mockDatabasePool(sandbox, undefined, new Error("Test"));
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction().catch(_ => done());
  });

  it('endTransaction should return void promise if there is no existing transaction connection', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.endTransaction().then(_ => done());
  });

  it('endTransaction should return void promise if a transaction connection exists', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction()
      .then(_ => subject.sampleEndTransaction())
      .then(_ => done());
  });

  it('endTransaction should return void promise if tansaction connection exists and rollback set to true', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction()
      .then(_ => subject.sampleEndTransaction(true))
      .then(_ => done());
  });

  it('endTransaction should throw original error if commit fails and rollback succeeds', (done) => {
    let connection = getDatabaseConnectionMock();
    connection.commit = sinon.stub().yields(new Error("Test"));
    connection.rollback = sinon.stub().yields(null);
    let pool = getDatabasePoolMock(connection);
    sandbox.stub(mysql, 'createPool').returns(<any>pool);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction()
      .then(_ => subject.sampleEndTransaction())
      .catch(ex => {
        expect(ex.message).to.equal("Test");
        done();
      });
  });

});

class SampleDatabaseContext extends DatabaseContext {
  models = { foo: new Collection<Foo>() }
  sampleQuery = (args = []) => this.query<void>('placeholder', args);
  sampleProcedure = (args: any) => this.callProcedure<void>('placeholder', args);
  sampleBeginTransaction = () => this.beginTransaction();
  sampleEndTransaction = (rollback: boolean = false) => this.endTransaction(rollback);
}

class Foo {
  bar: string;
}

export function mockDatabasePool(sandbox: sinon.SinonSandbox, connectionError?: Error, yieldsError?: Error): void {
  let connection = getDatabaseConnectionMock(yieldsError);
  let pool = getDatabasePoolMock(connection, connectionError);
  sandbox.stub(mysql, 'createPool').returns(<any>pool);
}

export function getDatabasePoolMock(connection: any, connectionError?: Error): any {
  return {
    getConnection: sinon.stub().yields(connectionError, connection)
  };
}

export function getDatabaseConnectionMock(yieldsError?: Error): any {
  return {
    query: sinon.stub().yields(null, null),
    release: () => (null),
    beginTransaction: sinon.stub().yields(yieldsError),
    endTransaction: () => (null),
    commit: sinon.stub().yields(null),
    rollback: sinon.stub().yields(yieldsError)
  }
}