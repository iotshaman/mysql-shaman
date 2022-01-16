import * as mysql from 'mysql';
import { PoolConnection, PoolConfig } from 'mysql';
import { CreateConnection, RunMySqlQuery } from '../mysql.functions';

export interface IDatabaseService {
  buildDatabase: (database: string, user: string, password: string) => Promise<void>;
  addUser: (user: string, password: string) => Promise<void>;
  grantUserPermissions: (user: string, database: string, role: string) => Promise<void>;
}

export class DatabaseService implements IDatabaseService {
  
  constructor(private mysqlConfig: PoolConfig, private scope: string = 'localhost') {
    
  }

  buildDatabase = (database: string, user: string, password: string): Promise<void> => {
    let pool = mysql.createPool(this.mysqlConfig);
    return CreateConnection(pool).then(connection => {
      return this.createDatabase(database, connection)
        .then(_ => this.createUser(user, password, connection))
        .then(_ => this.grantPermissions(user, database, "admin", connection))
        .then(_ => connection.release());
    })
  }

  addUser = (user: string, password: string): Promise<void> => {
    let pool = mysql.createPool(this.mysqlConfig);
    return CreateConnection(pool).then(connection => {
      return this.createUser(user, password, connection)
        .then(_ => connection.release());
    });
  }

  grantUserPermissions = (user: string, database: string, role: string): Promise<void> => {
    let pool = mysql.createPool(this.mysqlConfig);
    return CreateConnection(pool).then(connection => {
      return this.grantPermissions(user, database, role, connection)
        .then(_ => connection.release());
    });
  }
  
  private createDatabase = (database: string, connection: PoolConnection): Promise<void> => {
    return RunMySqlQuery(connection, `CREATE DATABASE ${database}`, [], false);
  }
  
  private createUser = (user: string, password: string, connection: PoolConnection): Promise<void> => {
    let cmd = `CREATE USER '${user}'@'${this.scope}' IDENTIFIED BY '${password}';`
    return RunMySqlQuery(connection, cmd, [], false);
  }
  
  private grantPermissions = (user: string, database: string, role: string, connection: PoolConnection): Promise<void> => {
    let rolePermissions = GrantRolePermissions[role];
    if (!rolePermissions) return Promise.reject(new Error(`Invalid role: ${role}.`));
    let commands = rolePermissions.reduce((a, b) => {
      a.push(`GRANT ${b} ON ${database} . * TO '${user}'@'${this.scope}';`)
      return a;
    }, []);
    commands.push('FLUSH PRIVILEGES;');
    return commands.reduce((a, b) => 
      a.then(_ => RunMySqlQuery(connection, b, [], false)), 
      Promise.resolve()
    );
  }

}

/* istanbul ignore next */
const GrantRolePermissions: {[role: string]: string[]} = {
  admin: ["INSERT", "SELECT", "UPDATE", "DELETE", "EXECUTE", "CREATE", "DROP"],
  service: ["INSERT", "SELECT", "UPDATE", "DELETE", "EXECUTE"],
  readonly: ["SELECT"]
}