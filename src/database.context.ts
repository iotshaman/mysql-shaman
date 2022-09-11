import * as mysql from 'mysql';
import { Pool, PoolConnection, PoolConfig } from 'mysql';

import { Collection } from './collection';
import { RunMySqlQuery, CreateConnection } from './mysql.functions';

export abstract class DatabaseContext {

  public abstract models: {[name: string]: Collection<any>};
  private pool: Pool;
  private transactionConnection: PoolConnection;

  initialize = (config: PoolConfig) => {
    this.pool = mysql.createPool(config);
    this.loadModels();
  }

  beginTransaction = (): Promise<void> => {
    return this.connectionFactory().then(connection => {
      connection.beginTransaction(null, (ex) => {
        if (!!ex) throw ex;
        this.transactionConnection = connection;
        let keys = Object.keys(this.models);
        keys.forEach(key => this.models[key].beginTransaction(connection));
      });
    });
  }

  endTransaction = (rollback: boolean = false): Promise<void> => {
    return new Promise<void>((res, err) => {
      let keys = Object.keys(this.models);
      keys.forEach(key => this.models[key].endTransaction());
      if (!this.transactionConnection) return res();
      if (rollback) this.transactionConnection.rollback(null, ex => {
        if (!!ex) return err(ex);
        this.transactionConnection.release();
        res();
      });
      else this.transactionConnection.commit(null, ex => {
        if (!!ex) this.transactionConnection.rollback(null, ex2 => {
          if (!!ex2) return err(new Error("A critical error occured while committing."));
          err(ex);
        });
        this.transactionConnection.release();
        res();
      })
    })
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