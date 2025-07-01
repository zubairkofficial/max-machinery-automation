# MachineryMax Database Setup

This document provides instructions on how to set up the database and seed it with initial data.

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running

## Database Setup Steps

1. **Setup Environment Variables**

   Create a `.env` file in the root directory with the following database connection details:

   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=machinery_max
   JWT_SECRET=your_jwt_secret_key
   ```

2. **Run the Database Migration**

   Run the migration to create the required database schema:

   ```bash
   npm run migration:run
   ```

   This will create all the necessary tables and add required columns including `name` and `role` to the user table.

3. **Seed the Database**

   Populate the database with initial seed data:

   ```bash
   npm run seed
   ```

   This command will create the following test users:

   | Username | Email                     | Password    | Role     |
   |----------|---------------------------|-------------|----------|
   | admin    | admin@machinerymax.com    | password123 | admin    |
   | manager  | manager@machinerymax.com  | password123 | manager  |
   | sales    | sales@machinerymax.com    | password123 | sales    |
   | support  | support@machinerymax.com  | password123 | user     |
   | demo     | demo@machinerymax.com     | password123 | user     |

4. **One-step Setup**

   Alternatively, you can run migrations and seed the database in one step:

   ```bash
   npm run setup:db
   ```

## Authentication

The system uses JWT for authentication. When logging in, you can use either the username or email along with the password. For example:

```
{
  "username": "admin@machinerymax.com", 
  "password": "password123"
}
```

The frontend sends the email in the username field, and the backend handles authentication by checking both username and email fields.

## Running the Application

After setting up the database:

```bash
npm run start:dev
```

The application will be available at http://localhost:3002 