
================================================================================
MULTI-TENANT DYNAMIC DATABASE & HR/OPERATIONS MANAGEMENT SYSTEM
================================================================================

This document provides a detailed overview of the system architecture, file structure, 
frontend components, and backend API endpoints of the Multi-Tenant project.

--------------------------------------------------------------------------------
1. TECHNOLOGY STACK & CORE DEPENDENCIES
--------------------------------------------------------------------------------
The project is split into a React client application and a set of Node.js-based
API endpoints handling schema management, tenant isolation, and Supabase database actions.

Frontend:
- Framework: React 18 (with TypeScript and Vite as the bundler)
- Styling: Tailwind CSS (v3), shadcn/ui components (Radix UI primitives)
- Routing: React Router DOM (v6)
- State Management & Data Fetching: TanStack React Query (v5)
- Forms: React Hook Form & Zod validation
- Visualization: Recharts (for dashboards/reports)
- Toast Notifications: Sonner / Radix Toast

Backend & Database:
- Database Client: Supabase JS SDK (`@supabase/supabase-js`)
- Backend Engine: Node.js (Vercel serverless functions / local endpoints)
- PostgreSQL Interface: `pg` library
- Edge Functions: Supabase CLI Edge Functions

--------------------------------------------------------------------------------
2. PROJECT DIRECTORY STRUCTURE
--------------------------------------------------------------------------------
- `/api`                       - Serverless/Backend API endpoints for schema and tenant management
- `/public`                    - Static assets for the React application
- `/src`                       - Main React + TypeScript application source
  - `/components`              - Reusable UI elements, Admin portal views, layouts, and schema explorers
  - `/contexts`                - Authentication and Notification React contexts
  - `/hooks`                   - Custom utility hooks (e.g., query, debounce)
  - `/integrations`            - Third-party integrations (Supabase connection client)
  - `/lib`                     - Shared library code (e.g., helper functions, Axios instances)
  - `/pages`                   - Page components mapping directly to application routes
  - `/services`                - Business logic services (e.g., db service, branch service)
  - `/types`                   - TypeScript type definitions
  - `/utils`                   - Helper utility scripts
- `/supabase`                  - Supabase configuration, DB migrations, and Edge Functions
- `index.html`                 - Application shell
- `package.json`               - Dependencies, devDependencies, and scripts
- `tailwind.config.ts`         - Styling configuration and color design systems
- `tsconfig.json`              - TypeScript configuration files
- `vite.config.ts`             - Build tool configs

--------------------------------------------------------------------------------
3. CLIENT-SIDE ROUTING & PAGES (`src/App.tsx`)
--------------------------------------------------------------------------------
The client is structured inside a global `TenantWrapper` context providing tenant detection
and configuration. The routes map to the following functional pages:

Authentication & Identity:
- `/auth`                      - Login / Sign-up for tenant users
- `/profile`                   - Current user profile details & credentials
- `/admin`                     - Admin portal login screen
- `/admin/home`                - Super-admin page for system operations
- `/admin/dashboard`           - Schema Explorer dashboard (table structure view)

HR & Operations (Tenant-specific):
- `/` (Home)                   - General tenant dashboard / metrics overview
- `/companies`                 - List of managed companies (for multi-tenant view)
- `/companies/:id`             - Detail view of a specific company (departments, policies)
- `/employees`                 - Full list of tenant employees
- `/employees/:id`             - Individual employee record, personal details, contact
- `/organization`              - Organizational chart / structural hierarchy
- `/leave`                     - Vacation and absence request tracker
- `/rota`                      - Shift scheduling and workforce rota manager
- `/timesheets`                - Work hour submissions and approvals
- `/documents`                 - Repository for tenant employee and company files
- `/payroll`                   - Payslip list and generation interface
- `/notifications`             - System-wide notifications and alerts log
- `/data-import`               - CSV/XLSX parser to batch upload employee or organizational data
- `/reports`                   - Recharts-based statistics and visual operational metrics
- `/settings`                  - Tenant system configurations, branding, and API tokens

--------------------------------------------------------------------------------
4. DYNAMIC DATABASE & SCHEMA APIS (`/api`)
--------------------------------------------------------------------------------
A major feature of this system is the ability to programmatically manipulate the database
schemas, tables, and rows dynamically across tenants. The backend endpoints do this:

Tenant & Project Administration:
- `createTenant.js`            - Creates and initializes a new tenant space
- `getTenantConfig.js`          - Retrieves styling, permissions, and database secrets for a tenant
- `saveTenant.js`               - Saves/updates tenant configuration settings
- `tenantLogin.js`              - Validates credentials and routes users to their respective tenant workspaces
- `updateTenantSecretKey.js`    - Updates database or client secrets securely
- `createProject.js`            - Provisions projects under a tenant schema
- `deleteProject.js`            - Removes existing projects

Schema & Metadata Discovery:
- `getAllSchemas.js`            - Lists all database schemas present in the database instance
- `getTables.js`                - Fetches a list of all tables under a specific schema
- `getTableData.js`             - Retrieves row entries for a given table
- `verifyTenantTable.js`        - Audits tables to ensure tenant-isolation columns are set up

DDL & Schema Management (Dynamic Tables & Columns):
- `createSchema.js`             - Runs dynamic DDL query to generate a new namespace/schema
- `deleteSchema.js`             - Drops a schema from the database
- `createTable.js`              - Dynamically creates tables with customizable data types
- `deleteTable.js`              - Drops a table from a dynamic schema
- `insertTableColumn.js`        - Appends a new field to a database table
- `deleteTableColumn.js`        - Removes a field from a database table
- `updateColumnName.js`         - Renames an existing table column
- `applySchema.js`              - Applies a batch schema change or imports schema definition mappings
- `captureSchema.js`            - Exports current database layout definition into JSON schemas

Data Manipulation (Dynamic DML):
- `insertTableRow.js`           - Performs dynamic INSERT query based on requested attributes
- `updateTableRow.js`           - Performs dynamic UPDATE statement matching row primary key
- `insideTableDelete.js`        - Deletes dynamic rows within targeted tables

Version Control & Edge Deployment:
- `creategithubBranch.js`       - Creates branches in the connected GitHub repo for schema changes
- `githubDeleteSubBranch.js`    - Deletes branches once schema updates are merged
- `deployEdgeFunctionsTest.js`   - Tests Supabase Edge Function setups
