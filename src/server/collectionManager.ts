import { Collection, CollectionManager, CollectionOptions, ICollection, IRepository } from '@nocobase/data-source-manager';
import { Neo4jRepository } from './repo';
import { Driver } from 'neo4j-driver';

export class Neo4jCollectionManager extends CollectionManager {
  protected collections: Map<string, ICollection> = new Map();
  protected repositories: Map<string, IRepository> = new Map();
  private _db: any;

  constructor(options: any) {
    super(options);
    this._db = options.db || null;
  }

  defineCollection(options: Omit<CollectionOptions, 'repository'>): Collection {
    const collection = new Collection({ ...options, repository: Neo4jRepository } as any, this);
    this.collections.set(options.name, collection);
    return collection;
  }

  newCollection(options: Omit<CollectionOptions, 'repository'>): Collection {
    const collection = new Collection({ ...options, repository: Neo4jRepository } as any, this);
    this.collections.set(options.name, collection);
    return collection;
  }

  getCollection(name: string): ICollection {
    return this.collections.get(name) as ICollection;
  }

  getCollections(): Array<ICollection> {
    return [...this.collections.values()];
  }

  hasCollection(name: string): boolean {
    return this.collections.has(name);
  }

  removeCollection(name: string): void {
    this.collections.delete(name);
  }

  getRepository(name: string, sourceId?: string | number): IRepository {
    const collection = this.getCollection(name);
    if (!collection) {
      throw new Error(`Collection "${name}" not found`);
    }
    return collection.repository;
  }

  sync(): Promise<void> {
    return Promise.resolve();
  }

  get db() {
    return this._db;
  }
}
