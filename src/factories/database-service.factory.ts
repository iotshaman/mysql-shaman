import { PoolConfig } from "mysql";
import { IDatabaseService, DatabaseService } from "../services/database.service";

export function DatabaseServiceFactory(config: PoolConfig, scope: string): IDatabaseService {
  return new DatabaseService(config, scope);
}