import 'mocha';
import * as mysql from 'mysql';
import * as sinon from "sinon";
import { expect } from 'chai';
import { mockDatabasePool } from './database.context.spec';
import { 
  CreateConnection, 
  RunMySqlQuery, 
  CreateCommaDelimitedList,
  GetMySqlColumns,
  GetMySqlConditions
} from './mysql.functions';

describe('MySql Functions', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('CreateConnection should return connection', (done) => {
    mockDatabasePool(sandbox);
    let pool = mysql.createPool({});
    CreateConnection(pool).then(conn => {
      expect(conn).not.to.be.null;
      done();
    });
  });

  it('CreateConnection should throw error if mysql throws', (done) => {
    mockDatabasePool(sandbox, new Error("testing"));
    let pool = mysql.createPool({});
    CreateConnection(pool).catch(_ => done());
  });

  it('RunMySqlQuery should return an empty array', (done) => {
    getPoolConnectionMock().then(connection => {
      RunMySqlQuery<string[]>(connection, 'placeholder', null).then(rslt => {
        expect(rslt.length).to.equal(0);
        done();
      });
    })
  });

  it('RunMySqlQuery should throw error if mysql throws', (done) => {
    getPoolConnectionMock(new Error("testing")).then(connection => {
      RunMySqlQuery<string[]>(connection, 'placeholder', null).catch(_ => done());
    })
  });

  it('CreateCommaDelimitedList should return comma delimited list', () => {
    let result = CreateCommaDelimitedList(['a', 'b', 'c']);
    expect(result).to.equal('a, b, c');
  });

  it('GetMySqlColumns should return wildcard if query is null', () => {
    let result = GetMySqlColumns(null);
    expect(result).to.equal('*');
  });

  it('GetMySqlColumns should return wildcard if no columns provided', () => {
    let result = GetMySqlColumns({});
    expect(result).to.equal('*');
  });

  it('GetMySqlColumns should return comma delimited list', () => {
    let result = GetMySqlColumns({columns: ['a', 'b', 'c']});
    expect(result).to.equal('a, b, c');
  });

  it('GetMySqlConditions should return empty string if query is null', () => {
    let result = GetMySqlConditions(null);
    expect(result).to.equal('');
  });

  it('GetMySqlConditions should return empty string if no conditions provided', () => {
    let result = GetMySqlConditions({});
    expect(result).to.equal('');
  });

  it('GetMySqlConditions should return empty string if conditions is empty', () => {
    let result = GetMySqlConditions({conditions: []});
    expect(result).to.equal('');
  });

  it('GetMySqlConditions should return condition list', () => {
    let result = GetMySqlConditions({conditions: [
      'a = ?', 'b = ?'
    ]});
    expect(result).to.equal('a = ? AND b = ?');
  });

});

export function getPoolConnectionMock(queryError: any = null, queryResult: any = []): 
  Promise<mysql.PoolConnection> {
  return new Promise((res) => {
    let pool = mysql.createPool({});
    let connection = {
      query: sinon.stub().yields(queryError, queryResult),
      release: () => (null)
    }
    sinon.stub(pool, "getConnection").yields(null, connection);
    return pool.getConnection((_, conn) => res(conn))
  });
}