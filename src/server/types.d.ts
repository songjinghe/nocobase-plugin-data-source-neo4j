export interface Neo4jDataSourceOptions {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
  useSSL?: boolean;
}

export interface CypherConfig {
  list?: string;
  get?: string;
  create?: string;
  update?: string;
  destroy?: string;
  count?: string;
}

export interface QueryOptions {
  filter?: Record<string, any>;
  filterByTk?: string | number | Record<string, any>;
  fields?: string[];
  appends?: string[];
  except?: string[];
  sort?: string[];
  page?: number;
  pageSize?: number;
  paginate?: boolean;
  values?: Record<string, any>;
}
