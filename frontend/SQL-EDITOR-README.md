# SQL Editor System for Supabase

A comprehensive SQL editor system built for Supabase with advanced features including syntax highlighting, auto-completion, query templates, and more.

## 🚀 Features

### Core Features
- **Advanced SQL Editor** with syntax highlighting
- **Auto-completion** for SQL keywords
- **Query Templates** with parameter substitution
- **Query History** with execution details
- **Database Schema Explorer** with table and column information
- **Connection Management** for multiple Supabase projects
- **Query Execution** with real-time results
- **Export Results** to CSV and JSON formats
- **Query Formatting** for better readability

### Advanced Features
- **Template System** with 25+ pre-built SQL templates
- **Parameter Substitution** in templates
- **Connection Profiles** for multiple databases
- **Execution Statistics** (timing, row counts, query types)
- **Error Handling** with detailed error messages
- **Security Validation** to prevent dangerous queries
- **Responsive Design** for all screen sizes

## 📁 File Structure

```
frontend/
├── components/
│   ├── sql-editor.tsx                    # Basic SQL editor component
│   ├── enhanced-sql-editor.tsx          # Advanced SQL editor with all features
│   └── sql-template-selector.tsx        # Template selection modal
├── app/
│   ├── sql-editor/
│   │   └── page.tsx                     # Basic SQL editor page
│   ├── enhanced-sql-editor/
│   │   └── page.tsx                     # Enhanced SQL editor page
│   └── api/
│       └── sql/
│           ├── execute/
│           │   └── route.ts             # SQL execution API
│           └── schema/
│               └── route.ts             # Database schema API
├── lib/
│   └── sql-templates.ts                 # SQL templates and utilities
└── supabase-sql-functions.sql           # Required Supabase functions
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Supabase Functions

Run the SQL functions in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-sql-functions.sql
-- This creates the necessary RPC functions for the SQL editor
```

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Access the SQL Editor

Navigate to:
- **Basic Editor**: `http://localhost:3000/sql-editor`
- **Enhanced Editor**: `http://localhost:3000/enhanced-sql-editor`

## 📋 SQL Templates

The system includes 25+ pre-built SQL templates organized by category:

### Basic Queries
- Select All Records
- Count Records
- Select Distinct Values

### Insert Queries
- Insert Single Record
- Insert Multiple Records
- Insert from Select

### Update Queries
- Update Single Record
- Update Multiple Columns
- Update with Join

### Delete Queries
- Delete by ID
- Delete by Condition
- Delete Duplicates

### Join Queries
- Inner Join
- Left Join
- Multiple Joins

### Aggregates
- Group By with Aggregates
- Having Clause

### Date Queries
- Date Range Query
- Date Functions

### Search Queries
- Text Search
- Full Text Search

### Schema Management
- Create Table
- Add Column
- Create Index

### Analytics
- Window Functions
- Pivot Query

## 🔧 API Endpoints

### `/api/sql/execute`
Executes SQL queries safely with validation.

**Request:**
```json
{
  "query": "SELECT * FROM users LIMIT 10;",
  "connectionParams": {
    "url": "your-supabase-url",
    "key": "your-supabase-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "rowCount": 10,
  "executionTime": 150,
  "queryType": "SELECT"
}
```

### `/api/sql/schema`
Retrieves database schema information.

**Request:**
```bash
GET /api/sql/schema?url=your-supabase-url&key=your-supabase-key
```

**Response:**
```json
{
  "success": true,
  "schema": {
    "tables": [...],
    "columns": {...},
    "indexes": {...},
    "foreignKeys": {...}
  }
}
```

## 🔒 Security Features

### Query Validation
- Prevents dangerous operations (DROP, TRUNCATE, etc.)
- Validates query syntax
- Limits to SELECT queries for safety
- Prevents multiple statement execution

### Connection Security
- Secure credential storage
- Connection validation
- Error handling for invalid connections

## 🎨 Customization

### Adding New Templates

1. Add to `frontend/lib/sql-templates.ts`:

```typescript
{
  id: 'my-template',
  name: 'My Custom Template',
  description: 'Description of what this template does',
  category: 'Custom',
  query: 'SELECT * FROM {table_name} WHERE {condition};',
  parameters: ['table_name', 'condition'],
  tags: ['custom', 'select']
}
```

2. Add the category to `SQL_CATEGORIES` if it's new.

### Customizing the Editor

The editor components are fully customizable:
- Modify styling in the component files
- Add new features by extending the existing components
- Customize the auto-completion by modifying `SQL_KEYWORDS`

## 🚀 Usage Examples

### Basic Usage

```typescript
// Navigate to the SQL editor
window.location.href = '/enhanced-sql-editor';
```

### Using Templates

1. Click the "📋 Templates" button
2. Select a category or search for templates
3. Choose a template
4. Fill in the required parameters
5. Click "Use Template" to insert into the editor

### Managing Connections

1. Click the connection button in the header
2. Click "+ Add" to add a new connection
3. Enter connection details (name, URL, API key)
4. Select the active connection from the list

### Executing Queries

1. Write your SQL query in the editor
2. Press `Cmd/Ctrl + Enter` or click "Execute Query"
3. View results in the results panel
4. Export results using the export buttons

## 🔍 Troubleshooting

### Common Issues

**"Supabase URL and key are required"**
- Ensure environment variables are set correctly
- Check that the Supabase URL and key are valid

**"Failed to connect to Supabase"**
- Verify your Supabase project is active
- Check that the API key has the correct permissions

**"Query execution failed"**
- Ensure you've run the SQL functions in Supabase
- Check that the query syntax is correct
- Verify you have permissions to execute the query

### Performance Tips

1. **Use LIMIT** for large result sets
2. **Add indexes** for frequently queried columns
3. **Use EXPLAIN** to analyze query performance
4. **Optimize JOINs** by using appropriate indexes

## 📈 Future Enhancements

- **Syntax Highlighting** with Monaco Editor
- **Query Performance Analysis** with execution plans
- **Database Visualization** with ERD diagrams
- **Collaborative Editing** with real-time sync
- **Query Scheduling** and automation
- **Advanced Analytics** with charts and graphs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

This SQL editor system is part of the enterprise AI context demo project.
