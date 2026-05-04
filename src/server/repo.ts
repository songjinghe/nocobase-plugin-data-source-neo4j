import neo4j, { Driver, Session } from 'neo4j-driver';
import { IModel, IRepository } from '@nocobase/data-source-manager';
import { recordToModel, buildCypherParams, autoListCypher, autoCountCypher, autoGetCypher } from './cypherUtils';
import { QueryOptions, CypherConfig } from './types';

export class Neo4jRepository implements IRepository {
  private collectionManager: any;
  private options: { name: string; cypher?: CypherConfig; template?: string };

  constructor(opt: { collectionManager: any; options: any }) {
    this.collectionManager = opt.collectionManager;
    this.options = opt.options;
  }

  private get driver(): Driver {
    return this.collectionManager.dataSource.driver as Driver;
  }

  private get cypher(): CypherConfig {
    return this.options.cypher || {};
  }

  private get label(): string {
    return this.options.name;
  }

  private async runReadQuery(cypherTemplate: string, params: Record<string, any>): Promise<any[]> {
    const session: Session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.executeRead((tx) => tx.run(cypherTemplate, params));
      return result.records.map((record) => recordToModel(record));
    } finally {
      await session.close();
    }
  }

  private async runWriteQuery(cypherTemplate: string, params: Record<string, any>): Promise<any[]> {
    const session: Session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      const result = await session.executeWrite((tx) => tx.run(cypherTemplate, params));
      return result.records.map((record) => recordToModel(record));
    } finally {
      await session.close();
    }
  }

  async find(options?: QueryOptions): Promise<IModel[]> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.list || autoListCypher(this.label);
    return this.runReadQuery(cypherTemplate, params);
  }

  async findOne(options?: QueryOptions): Promise<IModel> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.get || autoGetCypher(this.label);
    const rows = await this.runReadQuery(cypherTemplate, params);
    return rows[0] as IModel;
  }

  async count(options?: QueryOptions): Promise<number> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.count || autoCountCypher(this.label);
    const rows = await this.runReadQuery(cypherTemplate, params);
    if (rows.length === 0) return 0;
    const first = rows[0];
    const totalKey = Object.keys(first).find((k) => k.toLowerCase() === 'total') || Object.keys(first)[0];
    const val = first[totalKey];
    return typeof val === 'number' ? val : Number(val);
  }

  async findAndCount(options?: QueryOptions): Promise<[IModel[], number]> {
    const [rows, total] = await Promise.all([this.find(options), this.count(options)]);
    return [rows as IModel[], total];
  }

  async create(options?: QueryOptions): Promise<IModel> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.create;
    if (!cypherTemplate) {
      throw new Error(`Collection "${this.label}" does not define a create Cypher statement.`);
    }
    const rows = await this.runWriteQuery(cypherTemplate, params);
    return rows[0] as IModel;
  }

  async update(options?: QueryOptions): Promise<IModel> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.update;
    if (!cypherTemplate) {
      throw new Error(`Collection "${this.label}" does not define an update Cypher statement.`);
    }
    const rows = await this.runWriteQuery(cypherTemplate, params);
    return rows[0] as IModel;
  }

  async destroy(options?: QueryOptions): Promise<void> {
    const params = buildCypherParams(options || {});
    const cypherTemplate = this.cypher.destroy;
    if (!cypherTemplate) {
      throw new Error(`Collection "${this.label}" does not define a destroy Cypher statement.`);
    }
    await this.runWriteQuery(cypherTemplate, params);
  }
}
