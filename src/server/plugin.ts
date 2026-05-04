import { Plugin } from '@nocobase/server';
import Neo4jDataSource from './datasource';

export class PluginNeo4jServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.dataSourceManager.factory.register('neo4j', Neo4jDataSource);
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNeo4jServer;
