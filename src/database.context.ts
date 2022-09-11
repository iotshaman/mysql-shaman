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
    return new Promise((res, err) => {
      this.connectionFactory().then(rslt => {
        rslt.connection.beginTransaction((ex) => {
          if (!!ex) return err(ex);
          this.transactionConnection = rslt.connection;
          res();
        });
      }).catch(ex => err(ex));
    })
  }

  endTransaction = (rollback: boolean = false): Promise<void> => {
    return new Promise<void>((res, err) => {
      if (!this.transactionConnection) return res();
      if (rollback) this.transactionConnection.rollback(ex => {
        if (!!ex) {          
          this.transactionConnection = undefined;
          return err(ex);
        }
        this.transactionConnection.release();
        this.transactionConnection = undefined;
        res();
      });
      else this.transactionConnection.commit(ex => {
        if (!!ex) this.transactionConnection.rollback(ex2 => {
          this.transactionConnection = undefined;
          if (!!ex2) return err(new Error("A critical error occured while committing."));
          err(ex);
        });
        this.transactionConnection.release();
        this.transactionConnection = undefined;
        res();
      })
    })
  }

  protected query = <T>(query: string, args: any) => {
    return this.connectionFactory()
      .then(rslt => RunMySqlQuery<T>(rslt.connection, query, args));
  }

  protected callProcedure = <T>(procedure: string, args: any[]) => {
    let argList = args.reduce((a, _b) => `${a}${a == "" ? "" :", "}?`, '');
    let query = `CALL ${procedure} (${argList});`;
    return this.connectionFactory()
      .then(rslt => RunMySqlQuery<T>(rslt.connection, query, args));
  }

  private loadModels = () => {
    let keys = Object.keys(this.models);
    keys.forEach(key => this.models[key].initialize(key, this.connectionFactory));
  }

  private connectionFactory = (): Promise<{connection: PoolConnection, transaction: boolean}> => {
    if (!!this.transactionConnection) 
      return Promise.resolve({connection: this.transactionConnection, transaction: true});
    return CreateConnection(this.pool).then(connection => ({connection, transaction: false}));
  }

}