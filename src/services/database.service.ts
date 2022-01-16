import * as mysql from 'mysql';
import { PoolConnection, PoolConfig } from 'mysql';
import { CreateConnection, RunMySqlQuery } from '../mysql.functions';

export interface IDatabaseService {
  buildDatabase: (database: string, user: string, password: string) => Promise<void>;
}

export class DatabaseService implements IDatabaseService {
  
  constructor(private mysqlConfig: PoolConfig, private scope: string = 'localhost') {
    
  }

  buildDatabase = (database: string, user: string, password: string): Promise<void> => {
    let pool = mysql.createPool(this.mysqlConfig);
    return CreateConnection(pool).then(connection => {
      return this.createDatabase(database, connection)
        .then(_ => this.createUser(user, password, connection))
        .then(_ => this.grantPermissions(user, database, connection))
        .then(_ => connection.release());
    })
  }
  
  private createDatabase = (database: string, connection: PoolConnection): Promise<void> => {
    return RunMySqlQuery(connection, `CREATE DATABASE ${database}`, [], false);
  }
  
  private createUser = (user: string, password: string, connection: PoolConnection): Promise<void> => {
    let cmd = `CREATE USER '${user}'@'${this.scope}' IDENTIFIED BY '${password}';`
    return RunMySqlQuery(connection, cmd, [], false);
  }
  
  private grantPermissions = (user: string, database: string, connection: PoolConnection): Promise<void> => {
    let commands = [
      `GRANT INSERT ON ${database} . * TO '${user}'@'${this.scope}';`,
      `GRANT SELECT ON ${database} . * TO '${user}'@'${this.scope}';`,
      `GRANT UPDATE ON ${database} . * TO '${user}'@'${this.scope}';`,
      `GRANT DELETE ON ${database} . * TO '${user}'@'${this.scope}';`,
      `GRANT EXECUTE ON ${database} . * TO '${user}'@'${this.scope}';`,
      'FLUSH PRIVILEGES;'
    ];
    return commands.reduce((a, b) => 
      a.then(_ => RunMySqlQuery(connection, b, [], false)), 
      Promise.resolve()
    );
  }

}