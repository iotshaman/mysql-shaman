import { PoolConnection } from "mysql";

export function RunMySqlQuery<T>(connection: PoolConnection, query: string, args: any): Promise<T> {
  return new Promise<T>((res, err) => {
    connection.query(query, args, (mysqlErr, rslt) => {
      connection.release();
      if (mysqlErr) return err(mysqlErr);
      return res(rslt);
    });
  })
}

export function CreateCommaDelimitedList(array: string[]): string {
  return array.reduce((a, b) => `${a}${!a ? "" : ", "}${b}`, "");
}