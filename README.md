# @dbmy/plugin-data-source-neo4j

NocoBase data-source plugin for **Neo4j 4.4** (Bolt protocol). Supports custom Cypher queries with tabular display and simple data modifications.

## Features

- **Bolt Protocol** - Connects to Neo4j via `bolt://` (or `bolt+s://` with SSL).
- **Custom Cypher Queries** - Define per-collection Cypher statements for `list`, `get`, `create`, `update`, and `destroy`.
- **Graph to Table** - Automatically flattens Neo4j Nodes, Relationships, Paths, and native types into plain JSON rows for NocoBase blocks.
- **Read/Write Transactions** - Uses `executeRead` and `executeWrite` for safe Cypher execution.

## Install from npm

```bash
npm install @dbmy/plugin-data-source-neo4j
```

Or copy the plugin folder into your NocoBase app:

```bash
cp -r packages/plugins/@dbmy/plugin-data-source-neo4j \
  /path/to/your-nocobase-app/packages/plugins/@dbmy/plugin-data-source-neo4j
```

Then enable it:

```bash
yarn pm enable @dbmy/plugin-data-source-neo4j
```

Restart the NocoBase server after enabling.

## Configuration

1. Open **Settings - Data Sources** in NocoBase.
2. Click **Add new** and choose **Neo4j**.
3. Fill in the connection parameters:
   - **Host** - Neo4j server hostname or IP.
   - **Port** - Bolt port (default `7687`).
   - **Username** - Neo4j user.
   - **Password** - Neo4j password.
   - **Database** *(optional)* - Target Neo4j database name.
   - **Use SSL** - Enable `bolt+s://` when checked.
4. Save and test connection.

## Creating a Collection

1. Inside the Neo4j data source, create a **General collection**.
2. In the collection settings, switch to the **Cypher** tab (if available) or edit the collection JSON options directly:
   ```json
   {
     "cypher": {
       "list": "MATCH (n:Person) RETURN n.name AS name, n.age AS age LIMIT $limit OFFSET $skip",
       "get": "MATCH (n:Person {id: $filterByTk}) RETURN n.name AS name, n.age AS age LIMIT 1",
       "create": "CREATE (n:Person {name: $values.name, age: $values.age}) RETURN n.name AS name, n.age AS age",
       "update": "MATCH (n:Person {id: $filterByTk}) SET n.name = $values.name, n.age = $values.age RETURN n.name AS name, n.age AS age",
       "destroy": "MATCH (n:Person {id: $filterByTk}) DELETE n"
     }
   }
   ```
3. Define fields matching the `RETURN` aliases (e.g. `name` as **Single text**, `age` as **Integer**).
4. Add a **Table block** on any page and select the collection to view results.

### Supported Cypher Parameters

| Parameter       | Source                                    |
|-----------------|-------------------------------------------|
| `$limit`        | `pageSize` from list pagination            |
| `$skip`         | `(page - 1) * pageSize` from pagination    |
| `$sortField`    | First sort field (without leading `-`)   |
| `$sortOrder`    | `ASC` or `DESC`                           |
| `$filterByTk`   | Primary key / target key from detail view  |
| `$values`       | Form values from create/update actions     |
| `$filter`       | NocoBase filter object (JSON)              |

If you omit a custom Cypher statement, the plugin falls back to auto-generated Cypher based on the collection name as a Neo4j label, e.g. `MATCH (n:Label) RETURN n ...`.

## Development

### Build

```bash
npm install
npm run build
```

This compiles both server and client code into the `dist/` directory.

### Type Check

```bash
npx tsc --project tsconfig.server.json --noEmit
npx tsc --project tsconfig.client.json --noEmit
```

## Architecture

| File                        | Responsibility                                      |
|-----------------------------|-----------------------------------------------------|
| `src/server/datasource.ts`  | `Neo4jDataSource` - driver lifecycle, connection test |
| `src/server/collectionManager.ts` | `Neo4jCollectionManager` - collection registry    |
| `src/server/repo.ts`        | `Neo4jRepository` - Cypher execution, CRUD, pagination |
| `src/server/cypherUtils.ts` | Flattening Neo4j types to plain JSON |
| `src/server/plugin.ts`      | Server plugin entry - registers `neo4j` data-source type |
| `src/client/plugin.tsx`     | Client plugin entry - registers frontend data-source type |

## Release

This project uses **GitHub Actions + npm Trusted Publishing** for automated releases. No npm token is required.

### One-time Setup: Configure Trusted Publishing

1. Visit https://www.npmjs.com/settings/songjinghe/packages
2. Click **Add New Package** or go to your package page after first publish
3. Open **Publishing** tab, click **Add Trusted Publisher**
4. Fill in:
   - **Repository**: `dbmy/plugin-data-source-neo4j`
   - **Workflow name**: `release.yml`
   - **Publishes from**: `tags` (optional)
5. Click **Add**

> For detailed instructions, see: https://docs.npmjs.com/trusted-publishers

### Automatic Release (via GitHub tag)

1. Update `version` in `package.json` (e.g. `1.0.1`).
2. Commit and push a tag:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.1"
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions automatically builds and publishes to npm via Trusted Publishing.

### Manual Release

```bash
npm run build
npm login
npm publish --access public
```

## License

MIT
