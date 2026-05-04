import neo4j, { Node, Relationship, Path, Date, DateTime, Time, Duration, Point } from 'neo4j-driver';

/**
 * Flatten a single Neo4j value into a JSON-serializable plain object.
 */
export function flattenNeo4jValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Node
  if (value instanceof Node) {
    return {
      __type: 'Node',
      elementId: (value as any).elementId,
      labels: (value as any).labels,
      ...(value as any).properties,
    };
  }

  // Relationship
  if (value instanceof Relationship) {
    return {
      __type: 'Relationship',
      elementId: (value as any).elementId,
      type: (value as any).type,
      startNodeElementId: (value as any).startNodeElementId,
      endNodeElementId: (value as any).endNodeElementId,
      ...(value as any).properties,
    };
  }

  // Path
  if (value instanceof Path) {
    const path = value as any;
    return {
      __type: 'Path',
      start: flattenNeo4jValue(path.start),
      end: flattenNeo4jValue(path.end),
      segments: path.segments.map((seg: any) => ({
        start: flattenNeo4jValue(seg.start),
        relationship: flattenNeo4jValue(seg.relationship),
        end: flattenNeo4jValue(seg.end),
      })),
    };
  }

  // Integer (neo4j-driver internal type)
  if (neo4j.isInt && neo4j.isInt(value)) {
    if (neo4j.integer.inSafeRange(value)) {
      return neo4j.integer.toNumber(value);
    }
    return neo4j.integer.toString(value);
  }

  // Temporal types
  if (value instanceof Date || value instanceof DateTime || value instanceof Time || value instanceof Duration) {
    return (value as any).toString();
  }

  // Point (spatial)
  if (value instanceof Point) {
    const p = value as any;
    const out: any = { srid: p.srid, x: p.x, y: p.y };
    if (p.z !== undefined) out.z = p.z;
    return out;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map((item) => flattenNeo4jValue(item));
  }

  // Plain object (recursive)
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      out[key] = flattenNeo4jValue(value[key]);
    }
    return out;
  }

  // Primitive
  return value;
}

/**
 * Convert a Neo4j Record into a flat IModel-like object.
 */
export function recordToModel(record: any): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const key of record.keys) {
    obj[key] = flattenNeo4jValue(record.get(key));
  }
  return obj;
}

/**
 * Build Cypher parameters from NocoBase action options.
 */
export function buildCypherParams(options: {
  filter?: Record<string, any>;
  filterByTk?: string | number | Record<string, any>;
  values?: Record<string, any>;
  page?: number;
  pageSize?: number;
  sort?: string[];
}): Record<string, any> {
  const params: Record<string, any> = {};

  if (options.filter && Object.keys(options.filter).length > 0) {
    params.filter = options.filter;
  }

  if (options.filterByTk !== undefined) {
    params.filterByTk = options.filterByTk;
  }

  if (options.values && Object.keys(options.values).length > 0) {
    params.values = options.values;
  }

  if (options.pageSize !== undefined) {
    params.limit = options.pageSize;
    params.skip = ((options.page || 1) - 1) * options.pageSize;
  }

  if (options.sort && options.sort.length > 0) {
    const sortField = options.sort[0].replace(/^-/, '');
    const sortOrder = options.sort[0].startsWith('-') ? 'DESC' : 'ASC';
    params.sortField = sortField;
    params.sortOrder = sortOrder;
  }

  return params;
}

/**
 * Auto-generate a simple list Cypher for a given label if no custom cypher is provided.
 */
export function autoListCypher(label: string): string {
  return `MATCH (n:\`${label}\`) RETURN n LIMIT $limit OFFSET $skip`;
}

export function autoCountCypher(label: string): string {
  return `MATCH (n:\`${label}\`) RETURN count(n) AS total`;
}

export function autoGetCypher(label: string): string {
  return `MATCH (n:\`${label}\`) WHERE n.id = $filterByTk RETURN n LIMIT 1`;
}
