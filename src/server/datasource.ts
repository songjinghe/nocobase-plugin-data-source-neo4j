import { DataSource } from '@nocobase/data-source-manager';
import neo4j, { Driver, AuthToken } from 'neo4j-driver';
import { Neo4jCollectionManager } from './collectionManager';
import { Neo4jDataSourceOptions } from './types';

function buildAuthToken(username: string, password: string): AuthToken {
  return neo4j.auth.basic(username, password);
}

function createNeo4jDriver(options: Neo4jDataSourceOptions): Driver {
  const scheme = options.useSSL ? 'bolt+s' : 'bolt';
  const uri = `${scheme}://${options.host}:${options.port}`;
  const auth = buildAuthToken(options.username, options.password);
  return neo4j.driver(uri, auth, {
    maxConnectionPoolSize: 10,
    connectionAcquisitionTimeout: 30000,
  });
}

export default class Neo4jDataSource extends DataSource {
  private __name: string;
  private __database?: string;
  driver: Driver;

  constructor(options: Neo4jDataSourceOptions) {
    super(options);
    this.__name = options.name;
    this.__database = options.database;
    this.driver = createNeo4jDriver(options);
  }

  get name(): string {
    return this.__name;
  }

  static getDialect(): string {
    return 'neo4j';
  }

  static async testConnection(options: Neo4jDataSourceOptions): Promise<boolean> {
    const driver = createNeo4jDriver(options);
    try {
      await driver.verifyConnectivity();
      return true;
    } catch (err) {
      return false;
    } finally {
      await driver.close();
    }
  }

  createCollectionManager(options?: any): Neo4jCollectionManager {
    return new Neo4jCollectionManager({ ...options, dataSource: this });
  }

  async load(options: any = {}) {
    // No automatic introspection in v1; collections are defined manually or via UI template.
    // If future versions want label introspection, call `this.driver.session().run('CALL db.labels()')` here.
  }

  async unload() {
    await this.driver.close();
  }
}
