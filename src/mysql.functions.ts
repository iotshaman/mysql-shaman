import { Pool, PoolConnection, MysqlError } from "mysql";
import { EntityQuery } from "./entity-query";

export function CreateConnection(pool: Pool): Promise<PoolConnection> {
  return new Promise<PoolConnection>((res, err) => {
    pool.getConnection((connErr: MysqlError, conn: PoolConnection) => {
      if (connErr) return err(connErr);
      return res(conn);
    });
  });
}

export function RunMySqlQuery<T>(
  connection: PoolConnection, query: string, 
  args: any, release: boolean = true): Promise<T> {
  return new Promise<T>((res, err) => {
    connection.query(query, args, (mysqlErr, rslt) => {
      if (release) connection.release();
      if (mysqlErr) return err(mysqlErr);
      return res(rslt);
    });
  })
}

export function CreateCommaDelimitedList(array: string[]): string {
  return array.reduce((a, b) => `${a}${!a ? "" : ", "}${b}`, "");
}

export function GetMySqlColumns(query: EntityQuery): string {
  if (!query || !query.columns) return '*';
  return CreateCommaDelimitedList(query.columns);
}

export function GetMySqlConditions(query: EntityQuery) {
  if (!query || !query.conditions || query.conditions.length == 0) return '';
  return query.conditions.reduce((a, b) => {
    return `${a}${a == "" ? "" : " AND "}${b}`;
  }, '');
}