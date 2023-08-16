import { PoolOptions } from "mysql2";
import { IDatabaseService, DatabaseService } from "../services/database.service";

export function DatabaseServiceFactory(config: PoolOptions, scope: string): IDatabaseService {
  return new DatabaseService(config, scope);
}