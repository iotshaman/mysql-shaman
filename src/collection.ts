import { PoolConnection, OkPacket } from 'mysql';
import { EntityQuery } from './entity-query';
import { RunMySqlQuery, GetMySqlColumns, GetMySqlConditions, GetMySqlUpdateColumns } from './mysql.functions';

export class Collection<T> {

  private name: string;
  private connectionFactory: () => Promise<{connection: PoolConnection, transaction: boolean}>;

  initialize = (name: string, connectionFactory: () => Promise<{connection: PoolConnection, transaction: boolean}>) => {
    this.name = name;
    this.connectionFactory = connectionFactory;
  }

  find = (query?: EntityQuery): Promise<T[]> => {
    if (!query) return this.execute(`SELECT * FROM ${this.name};`);
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) return this.execute(`${qString};`, query.args, query.debug);
    return this.execute(`${qString} WHERE ${conditions};`, query.args, query.debug);
  }

  findOne = (query: EntityQuery): Promise<T> => {
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name} WHERE ${query.identity} = ? LIMIT 1;`;
    let req = this.execute<T[]>(qString, query.args, query.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  insert = (query: EntityQuery): Promise<void> => {
    var args = query.args.map(arg => {
      let keys = Object.keys(arg).filter(k => k != query.identity);
      let object: any = keys.reduce((a, b) => [...a, arg[b]], []);
      return object;
    });
    let columns = GetMySqlColumns(query);
    let qString = `INSERT INTO ${this.name} (${columns}) VALUES ?`;
    return this.execute(`${qString};`, [args], query.debug);
  }

  insertOne = (model: T, debug: boolean = false): Promise<number> => {
    let qString = `INSERT INTO ${this.name} SET ?;`;
    return this.execute<OkPacket>(qString, model, debug).then(ok => ok.insertId);
  }

  update = (model: T, query: EntityQuery): Promise<void> => {
    let columns = GetMySqlUpdateColumns(query);
    let conditions = GetMySqlConditions(query);
    let qString = `UPDATE ${this.name} SET ${columns} WHERE ${conditions}`;
    let columnValues = query.columns.map(c => model[c]);
    let args = [...columnValues, ...query.args];
    return this.execute<void>(qString, args, query.debug).then(_ => (null));
  }

  updateOne = (model: T, query: EntityQuery): Promise<void> => {
    let qString = `UPDATE ${this.name} SET ? WHERE ${query.identity} = ?`;
    let keys = Object.keys(model).filter(k => k != query.identity);
    let object: any = keys.reduce((a, b) => { a[b] = model[b]; return a; }, {});
    let args = [object, ...query.args];
    return this.execute<void>(qString, args, query.debug).then(_ => (null));
  }

  delete = (query: EntityQuery): Promise<void> => {
    if (!query.conditions) return Promise.reject("Delete all operation not allowed.");
    let qString = `DELETE FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    return this.execute(`${qString} WHERE ${conditions};`, query.args, query.debug).then(_ => (null));
  }

  deleteOne = (query: EntityQuery): Promise<void> => {
    let qString = `DELETE FROM ${this.name} WHERE ${query.identity} = ?;`;
    return this.execute<void>(qString, query.args, query.debug).then(_ => (null));
  }

  first = (columnName: string, query?: EntityQuery): Promise<T> => {
    if (!columnName) return Promise.reject(new Error("Column name not provided"));
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) qString = `${qString} ORDER BY ${columnName} ASC LIMIT 1;`;
    else qString = `${qString} WHERE ${conditions} ORDER BY ${columnName} ASC LIMIT 1;`;
    let req = this.execute<T[]>(qString, query?.args, query?.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  last = (columnName: string, query?: EntityQuery): Promise<T> => {
    if (!columnName) return Promise.reject(new Error("Column name not provided"));
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) qString = `${qString} ORDER BY ${columnName} DESC LIMIT 1;`;
    else qString = `${qString} WHERE ${conditions} ORDER BY ${columnName} DESC LIMIT 1;`;
    let req = this.execute<T[]>(qString, query?.args, query?.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  exists = (query: EntityQuery): Promise<boolean> => {
    return this.findOne(query).then(rslt => !!rslt);
  }

  private execute = <T>(query: string, args: any = null, debug: boolean = false) => {
    if (!!debug) {
      console.log(`Query string: ${query}`);
      console.log(`Query params: ${JSON.stringify(args)}`);
    }
    return this.connectionFactory()
      .then(rslt => RunMySqlQuery<T>(rslt.connection, query, args, !rslt.connection));
  }
}