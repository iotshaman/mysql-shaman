import 'mocha';
import { expect } from 'chai';
import { Collection } from './collection';
import { getPoolConnectionMock } from './mysql.functions.spec';

describe('Collections', () => {

  let foo: Collection<Foo>;

  it('find should run select all query', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.find().then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('SELECT * FROM foo;');
        done();
      })
      .catch(console.dir)
    });    
  });

  it('find should run select all query with columns', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.find({columns: ['bar']}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('SELECT bar FROM foo;');
        done();
      });
    });    
  });

  it('find should run select query with conditions', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.find({conditions: ['bar = ?'], args: [0]}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('SELECT * FROM foo WHERE bar = ?;');
        done();
      });
    });
  });

  it('findOne should return null', (done) => {
    getPoolConnectionMock(null, []).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.findOne({conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).to.be.null;
        done();
      });
    });
  });

  it('findOne should return result', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.findOne({conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).not.to.be.null;
        done();
      });
    });
  });

  it('findOne should return run select query with identity search', (done) => {
    getPoolConnectionMock(null, []).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.findOne({identity: 'id'}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('SELECT * FROM foo WHERE id = ? LIMIT 1;');
        done();
      });
    });
  });

  it('insert should run insert query', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      let query = { identity: 'id', columns: ['foo'], args: [{id: 0, bar: 0}] };
      foo.insert(query).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('INSERT INTO foo (foo) VALUES ?;');
        done();
      });
    });
  });

  it('insertOne should return inserted id', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.insertOne({bar: 0}, true).then(rslt => {
        expect(rslt).to.equal(0);
        done();
      });
    });
  });

  it('insertOne should run insert query', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.insertOne({bar: 0}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('INSERT INTO foo SET ?;');
        done();
      });
    });
  });

  it('updateOne should run update query', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.updateOne({id: 0, bar: 0}, {identity: 'id', args: [0]}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('UPDATE foo SET ? WHERE id = ?');
        done();
      });
    });
  });

  it('update should run update query', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.update({id: 0, bar: 0}, {columns: ['bar'], conditions: ['foo = ?'], args: [0]}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('UPDATE foo SET bar = ? WHERE foo = ?');
        done();
      });
    });
  });

  it('delete should throw error if no conditions provided', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.delete({}).catch(_ => done());
    });
  });

  it('delete should run delete query', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.delete({conditions: ['bar = ?'], args: [0]}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('DELETE FROM foo WHERE bar = ?;');
        done();
      });
    });
  });

  it('deleteOne should run delete query', (done) => {
    getPoolConnectionMock().then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.deleteOne({identity: 'id', args: [0]}).then(_ => {
        let query = connection.query.getCall(0).args[0];
        expect(query).to.equal('DELETE FROM foo WHERE id = ?;');
        done();
      });
    });
  });

  it('first should throw error if no column name provided', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.first("").catch(_ => done());
    });
  });

  it('first should return null', (done) => {
    getPoolConnectionMock(null, []).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.first("id").then(rslt=> {
        expect(rslt).to.be.null;
        done();
      });
    });
  });

  it('first should return result', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.first("id").then(rslt=> {
        expect(rslt).not.to.be.null;
        done();
      });
    });
  });

  it('first should return result from conditional search', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.first("id", {conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).not.to.be.null;
        done();
      });
    });
  });

  it('last should throw error if no column name provided', (done) => {
    getPoolConnectionMock(null, {insertId: 0}).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.last("").catch(_ => done());
    });
  });

  it('last should return null', (done) => {
    getPoolConnectionMock(null, []).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.last("id").then(rslt=> {
        expect(rslt).to.be.null;
        done();
      });
    });
  });

  it('last should return result', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.last("id").then(rslt=> {
        expect(rslt).not.to.be.null;
        done();
      });
    });
  });

  it('last should return result from conditional search', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.last("id", {conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).not.to.be.null;
        done();
      });
    });
  });

  it('exists should return false', (done) => {
    getPoolConnectionMock(null, []).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.exists({conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).not.to.be.true;
        done();
      });
    });
  });

  it('exists should return true', (done) => {
    getPoolConnectionMock(null, [{id: 0, bar: 0}]).then((connection: any) => {
      foo = new Collection();
      foo.initialize('foo', () => Promise.resolve({connection, transaction: false}));
      foo.exists({conditions: ['bar = ?'], args: [0]}).then(rslt=> {
        expect(rslt).to.be.true;
        done();
      });
    });
  });

});

interface Foo {
  id?: number;
  bar: number;
}