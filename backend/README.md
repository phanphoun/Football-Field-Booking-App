# Football Field Booking API

Backend API for the Football Field Booking Application.

## Tech Stack
- **Node.js** & **Express**
- **PostgreSQL** & **Sequelize**
- **JWT** Authentication

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory (copied from `.env.example` if available, or use the provided `.env`).
    Ensure your PostgreSQL server is running and the credentials in `.env` are correct.
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_NAME=football_booking
    JWT_SECRET=your_secret_key
    ```

3.  **Database Setup:**
    Ensure PostgreSQL service is running.
    Run the creation script (optional if you create DB manually):
    ```bash
    node src/utils/createDb.js
    ```

4.  **Seed Data (Optional):**
    Populate the database with initial data (Admin, Owner, Player, Field).
    **Warning: This resets the database!**
    ```bash
    node src/utils/seed.js
    ```

5.  **Run Server:**
    ```bash
    npm run dev
    ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile (Protected)

### Fields
- `GET /api/fields` - List all fields
- `GET /api/fields/:id` - Get field details
- `POST /api/fields` - Create a field (Admin/Owner)
- `PUT /api/fields/:id` - Update a field (Admin/Owner)
- `DELETE /api/fields/:id` - Delete a field (Admin/Owner)

### Bookings
- `POST /api/bookings` - Create a booking (Player/Captain)
- `GET /api/bookings` - Get bookings (User's own or Owner's fields)
- `PUT /api/bookings/:id` - Update booking status (Owner/Admin)

## Roles
- **Guest**: View only.
- **Player**: Book fields, join teams.
- **Captain**: Manage team, book fields.
- **Field Owner**: Manage fields, view bookings.
- **Admin**: Full access.
