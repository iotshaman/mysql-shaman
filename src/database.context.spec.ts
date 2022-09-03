import 'mocha';
import * as mysql from 'mysql';
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

  it('beginTransaction should return void promise', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction().then(_ => done());
  })

  // it('beginTransaction should throw if connection.beginTransaction throws', (done) => {
  //   mockDatabasePool(sandbox);
  //   let subject = new SampleDatabaseContext();
  //   subject.initialize({});
  //   subject.beginTransaction().then(_ => done());
  // });

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

  it('endTransaction sould return void promise if tansaction connection exists and rollback set to true', (done) => {
    mockDatabasePool(sandbox);
    let subject = new SampleDatabaseContext();
    subject.initialize({});
    subject.sampleBeginTransaction()
      .then(_ => subject.sampleEndTransaction(true))
      .then(_ => done());
  })

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

export function mockDatabasePool(sandbox: sinon.SinonSandbox, connectionError: Error = null): void {
  let pool = {
    getConnection: sinon.stub().yields(connectionError, {
      query: sinon.stub().yields(null, null),
      release: () => (null),
      beginTransaction: sinon.stub().yields(null, (ex) => { }),
      endTransaction: () => (null),
      commit: sinon.stub().yields(null, (ex) => { }),
      rollback: sinon.stub().yields(null, (ex) => { })
    })
  }
  sandbox.stub(mysql, 'createPool').returns(<any>pool);
}