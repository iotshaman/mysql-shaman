export interface EntityQuery {
  identity?: string;
  args?: any[];
  columns?: string[];
  conditions?: string[];
  limit?: number;
}