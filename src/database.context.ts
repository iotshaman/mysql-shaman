import * as mysql from 'mysql';
import { Pool, PoolConnection, PoolConfig } from 'mysql';

import { Collection } from './collection';
import { RunMySqlQuery, CreateConnection } from './mysql.functions';

export abstract class DatabaseContext {

  public abstract models: {[name: string]: Collection<any>};
  private pool: Pool;

  initialize = (config: PoolConfig) => {
    this.pool = mysql.createPool(config);
    this.loadModels();
  }

  protected query = <T>(query: string, args: any) => {
    return this.connectionFactory()
      .then(conn => RunMySqlQuery<T>(conn, query, args));
  }

  protected callProcedure = <T>(procedure: string, args: any[]) => {
    let argList = args.reduce((a, _b) => `${a}${a == "" ? "" :", "}?`, '');
    let query = `CALL ${procedure} (${argList});`;
    return this.connectionFactory()
      .then(conn => RunMySqlQuery<T>(conn, query, args));
  }

  private loadModels = () => {
    let keys = Object.keys(this.models);
    keys.forEach(key => this.models[key].initialize(key, this.connectionFactory));
  }

  private connectionFactory = (): Promise<PoolConnection> => {
    return CreateConnection(this.pool);
  }

}