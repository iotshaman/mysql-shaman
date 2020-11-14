import * as mysql from 'mysql';
import { Pool, PoolConnection, PoolConfig, MysqlError } from 'mysql';

import { Collection } from './collection';
import { RunMySqlQuery } from './db.functions';

export abstract class DatabaseContext {

  public abstract models: {[name: string]: Collection<any>};
  private pool: Pool;

  initialize = (config: PoolConfig) => {
    this.pool = mysql.createPool(config);
    this.loadModels();
  }

  protected callProcedure = <T>(procedure: string, args: any[]) => {
    let argList = args.reduce((a, _b) => `${a}${a == "" ? "" :", "}?`, '');
    let query = `CALL ${procedure} (${argList});`;
    return this.connectionFactory()
      .then(conn => RunMySqlQuery<T>(conn, query, args));
  }

  protected query = <T>(query: string, args: any) => {
    return this.connectionFactory()
      .then(conn => RunMySqlQuery<T>(conn, query, args));
  }

  private loadModels = () => {
    let keys = Object.keys(this.models);
    keys.forEach(key => this.models[key].initialize(key, this.connectionFactory));
  }

  private connectionFactory = (): Promise<PoolConnection> => {
    return new Promise<PoolConnection>((res, err) => {
      this.pool.getConnection((connErr: MysqlError, conn: PoolConnection) => {
        if (connErr) return err(connErr);
        return res(conn);
      });
    });
  }

}