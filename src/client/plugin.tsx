import { DataSource, Plugin } from '@nocobase/client';

class Neo4jClientDataSource extends DataSource {
  async getDataSource() {
    return (this as any).app.request({
      url: `/dataSources:getCollections?name=${(this as any).name}`,
    });
  }
}

class PluginNeo4jClient extends Plugin {
  async load() {
    (this as any).app.dataSourceManager.addDataSource(Neo4jClientDataSource, {
      key: 'neo4j',
      displayName: 'Neo4j',
    });
  }
}

export default PluginNeo4jClient;
