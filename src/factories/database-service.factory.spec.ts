import 'mocha';
import { expect } from 'chai';
import { DatabaseServiceFactory } from './database-service.factory';

describe('Database Service Factory', () => {

  it('DatabaseServiceFactory should return database service instance', () => {
    let subject = DatabaseServiceFactory({}, "");
    expect(subject).not.to.be.null;
  })

})