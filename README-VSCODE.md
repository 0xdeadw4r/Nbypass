# Running UID Management System in VS Code

This guide will help you run the project locally in Visual Studio Code.

## Prerequisites

- Node.js v20 or higher
- PostgreSQL database
- npm or pnpm package manager

## Environment Setup

1. **Clone the repository** (or extract the files to a folder)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/uid_management
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=uid_management
   PGUSER=your_username
   PGPASSWORD=your_password

   # Session
   SESSION_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   PORT=5000
   ```

   Replace the database credentials with your local PostgreSQL setup.

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE uid_management;
   ```

## Database Setup

1. **Push the schema to your database:**
   ```bash
   npm run db:push
   ```

   If you encounter errors, use:
   ```bash
   npm run db:push --force
   ```

2. **Seed the database with admin account:**
   ```bash
   npx tsx server/seed.ts
   ```

   This creates:
   - **Username:** admin
   - **Password:** itsmeuidbypass
   - **Credits:** $999,999.99 (unlimited for owner)

## Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open your browser and navigate to: http://localhost:5000
   - Login with the admin credentials

## API Configuration

The system integrates with an external UID bypass service:

- **Base URL:** `https://uidbypass.com/public/api/bypassapi.php`
- **API Key:** `uid_94fb2e07f08e2869a46d5bf2fc135af5`

These values are pre-configured in the database. You can update them in the **Settings** page.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                 # Express backend
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── api-client.ts      # External API client
│   ├── db.ts              # Database connection
│   ├── middleware.ts      # Auth middleware
│   └── index.ts           # Server entry point
├── shared/                 # Shared types
│   └── schema.ts          # Database schema + Zod schemas
└── package.json
```

## Features

### For Admin (Owner)
- **Dashboard:** Overview of system statistics
- **Users:** Create and manage user accounts
- **Credits:** Add or deduct credits for users
- **Settings:** Configure API settings
- **Activity:** Monitor all system activity

### For Regular Users
- **Dashboard:** View your credits and UIDs
- **Create UID:** Create UIDs with different durations
- **Activity:** View your own activity history

## Pricing Tiers

- 24 hours (1 day): $0.50
- 72 hours (3 days): $1.30
- 168 hours (1 week): $2.33
- 336 hours (2 weeks): $3.50
- 720 hours (1 month): $5.20

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check that credentials in `.env` are correct
- Verify the database exists

### Port Already in Use
If port 5000 is in use, change the `PORT` in `.env` and restart.

### API Errors
- Check that the API settings are configured correctly in Settings page
- Verify the API key is valid
- Check network connectivity

## Development Commands

```bash
# Start development server
npm run dev

# Push database schema
npm run db:push

# Force push database schema
npm run db:push --force

# Build for production
npm run build

# Start production server
npm start
```

## Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- Session cookies are HTTP-only and secure in production
- API keys are stored encrypted in the database
- CSRF protection via SameSite cookie policy

## Support

For issues or questions:
1. Check the Activity logs for error details
2. Review browser console for frontend errors
3. Check server logs for backend issues
