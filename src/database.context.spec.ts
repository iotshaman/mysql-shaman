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

});

class SampleDatabaseContext extends DatabaseContext {
  models = { foo: new Collection<Foo>() }  
  sampleQuery = (args = []) => this.query<void>('placeholder', args);
  sampleProcedure = (args: any) => this.callProcedure<void>('placeholder', args);
}

class Foo {
  bar: string;
}

export function mockDatabasePool(sandbox: sinon.SinonSandbox, connectionError: Error = null): void {
  let pool = {
    getConnection: sinon.stub().yields(connectionError, {
      query: sinon.stub().yields(null, null),
      release: () => (null)
    })
  }
  sandbox.stub(mysql, 'createPool').returns(<any>pool);
}