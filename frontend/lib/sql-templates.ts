export interface SQLTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  query: string;
  parameters?: string[];
  tags: string[];
}

export const SQL_TEMPLATES: SQLTemplate[] = [
  // Basic Queries
  {
    id: 'select-all',
    name: 'Select All Records',
    description: 'Retrieve all records from a table with a limit',
    category: 'Basic',
    query: 'SELECT * FROM {table_name} LIMIT {limit};',
    parameters: ['table_name', 'limit'],
    tags: ['select', 'basic', 'all']
  },
  {
    id: 'select-count',
    name: 'Count Records',
    description: 'Count the total number of records in a table',
    category: 'Basic',
    query: 'SELECT COUNT(*) as total_records FROM {table_name};',
    parameters: ['table_name'],
    tags: ['select', 'count', 'aggregate']
  },
  {
    id: 'select-distinct',
    name: 'Select Distinct Values',
    description: 'Get unique values from a column',
    category: 'Basic',
    query: 'SELECT DISTINCT {column_name} FROM {table_name};',
    parameters: ['column_name', 'table_name'],
    tags: ['select', 'distinct', 'unique']
  },

  // Insert Queries
  {
    id: 'insert-single',
    name: 'Insert Single Record',
    description: 'Insert one record into a table',
    category: 'Insert',
    query: `INSERT INTO {table_name} ({columns})
VALUES ({values});`,
    parameters: ['table_name', 'columns', 'values'],
    tags: ['insert', 'single', 'create']
  },
  {
    id: 'insert-multiple',
    name: 'Insert Multiple Records',
    description: 'Insert multiple records in a single statement',
    category: 'Insert',
    query: `INSERT INTO {table_name} ({columns})
VALUES 
  {values1},
  {values2},
  {values3};`,
    parameters: ['table_name', 'columns', 'values1', 'values2', 'values3'],
    tags: ['insert', 'multiple', 'batch']
  },
  {
    id: 'insert-select',
    name: 'Insert from Select',
    description: 'Insert records from another table using SELECT',
    category: 'Insert',
    query: `INSERT INTO {target_table} ({target_columns})
SELECT {source_columns}
FROM {source_table}
WHERE {condition};`,
    parameters: ['target_table', 'target_columns', 'source_columns', 'source_table', 'condition'],
    tags: ['insert', 'select', 'copy']
  },

  // Update Queries
  {
    id: 'update-single',
    name: 'Update Single Record',
    description: 'Update a specific record by ID',
    category: 'Update',
    query: `UPDATE {table_name}
SET {column} = '{value}'
WHERE id = {id};
`,
    parameters: ['table_name', 'column', 'value', 'id'],
    tags: ['update', 'single', 'modify']
  },
  {
    id: 'update-multiple-columns',
    name: 'Update Multiple Columns',
    description: 'Update multiple columns in a record',
    category: 'Update',
    query: `UPDATE {table_name}
SET 
  {column1} = '{value1}',
  {column2} = '{value2}',
  {column3} = '{value3}'
WHERE {condition};`,
    parameters: ['table_name', 'column1', 'value1', 'column2', 'value2', 'column3', 'value3', 'condition'],
    tags: ['update', 'multiple', 'columns']
  },
  {
    id: 'update-with-join',
    name: 'Update with Join',
    description: 'Update records using data from another table',
    category: 'Update',
    query: `UPDATE {table1}
SET {table1}.{column} = {table2}.{column}
FROM {table2}
WHERE {table1}.{join_column} = {table2}.{join_column}
AND {condition};`,
    parameters: ['table1', 'table2', 'column', 'join_column', 'condition'],
    tags: ['update', 'join', 'related']
  },

  // Delete Queries
  {
    id: 'delete-by-id',
    name: 'Delete by ID',
    description: 'Delete a specific record by ID',
    category: 'Delete',
    query: 'DELETE FROM {table_name} WHERE id = {id};',
    parameters: ['table_name', 'id'],
    tags: ['delete', 'single', 'id']
  },
  {
    id: 'delete-by-condition',
    name: 'Delete by Condition',
    description: 'Delete records matching a condition',
    category: 'Delete',
    query: 'DELETE FROM {table_name} WHERE {condition};',
    parameters: ['table_name', 'condition'],
    tags: ['delete', 'condition', 'filter']
  },
  {
    id: 'delete-duplicates',
    name: 'Delete Duplicates',
    description: 'Remove duplicate records, keeping only one',
    category: 'Delete',
    query: `DELETE FROM {table_name}
WHERE id NOT IN (
  SELECT MIN(id)
  FROM {table_name}
  GROUP BY {column}
);`,
    parameters: ['table_name', 'column'],
    tags: ['delete', 'duplicates', 'cleanup']
  },

  // Join Queries
  {
    id: 'inner-join',
    name: 'Inner Join',
    description: 'Join tables and return matching records',
    category: 'Joins',
    query: `SELECT {table1}.{column1}, {table2}.{column2}
FROM {table1}
INNER JOIN {table2} ON {table1}.{join_column} = {table2}.{join_column}
WHERE {condition};`,
    parameters: ['table1', 'table2', 'column1', 'column2', 'join_column', 'condition'],
    tags: ['join', 'inner', 'related']
  },
  {
    id: 'left-join',
    name: 'Left Join',
    description: 'Left join to include all records from left table',
    category: 'Joins',
    query: `SELECT {table1}.{column1}, {table2}.{column2}
FROM {table1}
LEFT JOIN {table2} ON {table1}.{join_column} = {table2}.{join_column}
WHERE {condition};`,
    parameters: ['table1', 'table2', 'column1', 'column2', 'join_column', 'condition'],
    tags: ['join', 'left', 'all']
  },
  {
    id: 'multiple-joins',
    name: 'Multiple Joins',
    description: 'Join multiple tables together',
    category: 'Joins',
    query: `SELECT {table1}.{column1}, {table2}.{column2}, {table3}.{column3}
FROM {table1}
INNER JOIN {table2} ON {table1}.{join1_column} = {table2}.{join1_column}
INNER JOIN {table3} ON {table2}.{join2_column} = {table3}.{join2_column}
WHERE {condition};`,
    parameters: ['table1', 'table2', 'table3', 'column1', 'column2', 'column3', 'join1_column', 'join2_column', 'condition'],
    tags: ['join', 'multiple', 'complex']
  },

  // Aggregate Queries
  {
    id: 'group-by-aggregate',
    name: 'Group By with Aggregates',
    description: 'Group data and calculate aggregates',
    category: 'Aggregates',
    query: `SELECT {group_column}, 
  COUNT(*) as count,
  AVG({numeric_column}) as average,
  SUM({numeric_column}) as total,
  MIN({numeric_column}) as minimum,
  MAX({numeric_column}) as maximum
FROM {table_name}
GROUP BY {group_column}
ORDER BY count DESC;`,
    parameters: ['group_column', 'numeric_column', 'table_name'],
    tags: ['group', 'aggregate', 'statistics']
  },
  {
    id: 'having-clause',
    name: 'Having Clause',
    description: 'Filter groups using HAVING clause',
    category: 'Aggregates',
    query: `SELECT {group_column}, COUNT(*) as count
FROM {table_name}
GROUP BY {group_column}
HAVING COUNT(*) > {threshold}
ORDER BY count DESC;`,
    parameters: ['group_column', 'table_name', 'threshold'],
    tags: ['group', 'having', 'filter']
  },

  // Date Queries
  {
    id: 'date-range',
    name: 'Date Range Query',
    description: 'Filter records within a date range',
    category: 'Dates',
    query: `SELECT *
FROM {table_name}
WHERE {date_column} BETWEEN '{start_date}' AND '{end_date}'
ORDER BY {date_column};`,
    parameters: ['table_name', 'date_column', 'start_date', 'end_date'],
    tags: ['date', 'range', 'filter']
  },
  {
    id: 'date-functions',
    name: 'Date Functions',
    description: 'Extract parts from dates',
    category: 'Dates',
    query: `SELECT 
  {date_column},
  EXTRACT(YEAR FROM {date_column}) as year,
  EXTRACT(MONTH FROM {date_column}) as month,
  EXTRACT(DAY FROM {date_column}) as day,
  DATE({date_column}) as date_only
FROM {table_name}
WHERE {date_column} >= NOW() - INTERVAL '{days} days';`,
    parameters: ['date_column', 'table_name', 'days'],
    tags: ['date', 'extract', 'functions']
  },

  // Search Queries
  {
    id: 'text-search',
    name: 'Text Search',
    description: 'Search for text using LIKE operator',
    category: 'Search',
    query: `SELECT *
FROM {table_name}
WHERE {text_column} LIKE '%{search_term}%'
ORDER BY {text_column};`,
    parameters: ['table_name', 'text_column', 'search_term'],
    tags: ['search', 'text', 'like']
  },
  {
    id: 'full-text-search',
    name: 'Full Text Search',
    description: 'Advanced text search using PostgreSQL full-text search',
    category: 'Search',
    query: `SELECT *, 
  ts_rank(to_tsvector('english', {search_column}), query) as rank
FROM {table_name}, to_tsquery('english', '{search_terms}') query
WHERE to_tsvector('english', {search_column}) @@ query
ORDER BY rank DESC;`,
    parameters: ['search_column', 'table_name', 'search_terms'],
    tags: ['search', 'fulltext', 'postgresql']
  },

  // Table Management
  {
    id: 'create-table',
    name: 'Create Table',
    description: 'Create a new table with common columns',
    category: 'Schema',
    query: `CREATE TABLE {table_name} (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
    parameters: ['table_name'],
    tags: ['create', 'table', 'schema']
  },
  {
    id: 'add-column',
    name: 'Add Column',
    description: 'Add a new column to an existing table',
    category: 'Schema',
    query: 'ALTER TABLE {table_name} ADD COLUMN {column_name} {data_type};',
    parameters: ['table_name', 'column_name', 'data_type'],
    tags: ['alter', 'add', 'column']
  },
  {
    id: 'create-index',
    name: 'Create Index',
    description: 'Create an index on a column for better performance',
    category: 'Schema',
    query: 'CREATE INDEX idx_{table_name}_{column_name} ON {table_name} ({column_name});',
    parameters: ['table_name', 'column_name'],
    tags: ['index', 'performance', 'optimization']
  },

  // Analytics Queries
  {
    id: 'window-functions',
    name: 'Window Functions',
    description: 'Use window functions for advanced analytics',
    category: 'Analytics',
    query: `SELECT 
  {column1},
  {column2},
  ROW_NUMBER() OVER (PARTITION BY {partition_column} ORDER BY {order_column}) as row_num,
  RANK() OVER (ORDER BY {order_column}) as rank,
  LAG({column2}) OVER (ORDER BY {order_column}) as previous_value
FROM {table_name}
ORDER BY {order_column};`,
    parameters: ['column1', 'column2', 'partition_column', 'order_column', 'table_name'],
    tags: ['window', 'analytics', 'advanced']
  },
  {
    id: 'pivot-query',
    name: 'Pivot Query',
    description: 'Transform rows to columns using conditional aggregation',
    category: 'Analytics',
    query: `SELECT 
  {category_column},
  SUM(CASE WHEN {value_column} = '{value1}' THEN 1 ELSE 0 END) as {value1}_count,
  SUM(CASE WHEN {value_column} = '{value2}' THEN 1 ELSE 0 END) as {value2}_count,
  SUM(CASE WHEN {value_column} = '{value3}' THEN 1 ELSE 0 END) as {value3}_count
FROM {table_name}
GROUP BY {category_column}
ORDER BY {category_column};`,
    parameters: ['category_column', 'value_column', 'value1', 'value2', 'value3', 'table_name'],
    tags: ['pivot', 'analytics', 'transform']
  }
];

export const SQL_CATEGORIES = [
  'Basic',
  'Insert',
  'Update',
  'Delete',
  'Joins',
  'Aggregates',
  'Dates',
  'Search',
  'Schema',
  'Analytics'
];

export function getTemplatesByCategory(category: string): SQLTemplate[] {
  return SQL_TEMPLATES.filter(template => template.category === category);
}

export function searchTemplates(query: string): SQLTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return SQL_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function replaceTemplateParameters(template: SQLTemplate, parameters: Record<string, string>): string {
  let query = template.query;
  
  if (template.parameters) {
    template.parameters.forEach(param => {
      const value = parameters[param] || `{${param}}`;
      query = query.replace(new RegExp(`{${param}}`, 'g'), value);
    });
  }
  
  return query;
}

export function validateTemplateParameters(template: SQLTemplate, parameters: Record<string, string>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (template.parameters) {
    template.parameters.forEach(param => {
      if (!parameters[param] || parameters[param].trim() === '') {
        missing.push(param);
      }
    });
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}
