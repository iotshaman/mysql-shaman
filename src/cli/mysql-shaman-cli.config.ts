import { PoolConfig } from 'mysql';

export interface MySqlShamanConfig {
  cwd: string;
  scripts: {
    tables: string[];
    primers?: string[];
    views?: string[];
    procedures?: string[];
  };
  poolConfig: PoolConfig;
}
