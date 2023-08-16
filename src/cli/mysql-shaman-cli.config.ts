import { PoolOptions } from 'mysql2';

export interface MySqlShamanConfig {
  poolConfig: PoolOptions;
  adminPoolConfig?: PoolOptions;
  cwd?: string;
  remote?: boolean;
  scripts?: {
    tables: string[];
    primers?: string[];
    views?: string[];
    procedures?: string[];
  };
}
