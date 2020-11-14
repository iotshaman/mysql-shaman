import { PoolConnection, OkPacket } from 'mysql';
import { EntityQuery } from './entity-query';
import { RunMySqlQuery, CreateCommaDelimitedList } from './db.functions';

export class Collection<T> {

  private name: string;
  private connectionFactory: () => Promise<PoolConnection>;

  initialize = (name: string, connectionFactory: () => Promise<PoolConnection>) => {
    this.name = name;
    this.connectionFactory = connectionFactory;
  }

  find = (query?: EntityQuery): Promise<T[]> => {
    if (!query) return this.execute(`SELECT * FROM ${this.name};`);
    let columns = this.getColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = this.getConditions(query);
    if (!conditions) return this.execute(`${qString};`, query.args);
    return this.execute(`${qString} WHERE ${conditions};`, query.args);
  }

  findOne = (query: EntityQuery): Promise<T> => {
    let columns = this.getColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name} WHERE ${query.identity} = ? LIMIT 1`;
    let req = this.execute<T[]>(qString, query.args);
    return req.then(rslt => (!rslt || rslt.length == 0) ? null : rslt[0]);
  }

  insert = (query: EntityQuery): Promise<void> => {
    var args = query.args.map(arg => {
      let keys = Object.keys(arg).filter(k => k != query.identity);
      let object: any = keys.reduce((a, b) => [...a, arg[b]], []);
      return object;
    });
    let columns = this.getColumns(query);
    let qString = `INSERT INTO ${this.name} (${columns}) VALUES ?;`;
    return this.execute(`${qString};`, [args]);
  }

  insertOne = (model: T): Promise<number> => {
    let qString = `INSERT INTO ${this.name} SET ?;`;
    return this.execute<OkPacket>(qString, model).then(ok => ok.insertId);
  }

  updateOne = (model: T, query: EntityQuery): Promise<void> => {
    let qString = `UPDATE ${this.name} SET ? WHERE ${query.identity} = ?`;
    let keys = Object.keys(model).filter(k => k != query.identity);
    let object: any = keys.reduce((a, b) => { a[b] = model[b]; return a; }, {});
    let args = [object, ...query.args];
    return this.execute<void>(qString, args).then(_ => (null));
  }

  delete = (query: EntityQuery): Promise<void> => {
    if (!query.conditions) return Promise.reject("Delete all operation not allowed.");
    let qString = `DELETE FROM ${this.name}`;
    let conditions = this.getConditions(query);
    return this.execute(`${qString} WHERE ${conditions};`, query.args).then(_ => (null));
  }

  deleteOne = (query: EntityQuery): Promise<void> => {
    let qString = `DELETE FROM ${this.name} WHERE ${query.identity} = ?`;
    return this.execute<void>(qString, query.args).then(_ => (null));
  }

  private getColumns(query: EntityQuery) {
    if (!query || !query.columns) return '*';
    return CreateCommaDelimitedList(query.columns);
  }

  private getConditions(query: EntityQuery) {
    if (!query || !query.conditions || query.conditions.length == 0) return '';
    return query.conditions.reduce((a, b) => {
      return `${a}${a == "" ? "" : " AND "}${b}`;
    }, '');
  }

  private execute<T>(query: string, args: any = null) {
    return this.connectionFactory()
      .then(conn => RunMySqlQuery<T>(conn, query, args));
  }
}