import 'mocha';
import * as sinon from "sinon";

import { mockDatabasePool } from '../database.context.spec';
import { DatabaseService } from './database.service';

describe('Database Service', () => {

  var sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(console, 'log');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('buildDatabase should return resolved promise for root scope', (done) => {
    mockDatabasePool(sandbox);
    let subject = new DatabaseService({}, '%');
    subject.buildDatabase("", "", "").then(_ => done());
  });

  it('buildDatabase should return resolved promise for default scope', (done) => {
    mockDatabasePool(sandbox);
    let subject = new DatabaseService({});
    subject.buildDatabase("", "", "").then(_ => done());
  });

});