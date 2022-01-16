import { PoolConfig } from 'mysql';

export interface MySqlShamanConfig {
  poolConfig: PoolConfig;
  adminPoolConfig?: PoolConfig;
  cwd?: string;
  scripts?: {
    tables: string[];
    primers?: string[];
    views?: string[];
    procedures?: string[];
  };
}
