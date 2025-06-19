# vint.

A modern, full-stack financial tracking application with a beautiful, sleek UI. Track your spending, manage transactions, and visualize your finances with ease.

## Features
- Google authentication for secure login
- Dashboard with colorful, interactive spending charts
- Add, edit, and delete transactions
- Categorize spending and view summaries
- Modern, responsive UI using Tailwind CSS
- Glassmorphism and animated backgrounds for a premium feel

## Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Authentication:** Google OAuth

## Database (PostgreSQL)
This application uses PostgreSQL as its primary database for storing user and transaction data. Make sure you have a PostgreSQL instance running and accessible to the backend.

### Database Setup
1. Install PostgreSQL if you don't have it already: https://www.postgresql.org/download/
2. Create a new database and user for the app:
   ```sql
   CREATE DATABASE vint_db;
   CREATE USER vint_user WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE vint_db TO vint_user;
   ```
3. Add your database connection string to the backend `.env` file:
   ```env
   DATABASE_URL=postgresql://vint_user:yourpassword@localhost:5432/vint_db
   ```
4. Run migrations or let the backend initialize the schema as needed.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+
- PostgreSQL
- (Optional) Yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd vint
```

### 2. Setup the Backend (FastAPI)
1. Navigate to the backend directory (if applicable):
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (e.g., Google OAuth credentials, JWT secret, Postgres connection):
   - Create a `.env` file and add:
     ```env
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     JWT_SECRET_KEY=your-jwt-secret
     DATABASE_URL=postgresql://vint_user:yourpassword@localhost:5432/vint_db
     ```
5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### 3. Setup the Frontend (React)
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up environment variables if needed (e.g., API URL):
   - Create a `.env` file and add:
     ```env
     REACT_APP_API_URL=http://localhost:8000
     ```
4. Start the frontend:
   ```bash
   npm start
   # or
   yarn start
   ```

### 4. Access the App
- Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
- **Login:** Sign in with Google to access your dashboard.
- **Dashboard:** View your spending summary and interactive charts.
- **Transactions:** Add, edit, or delete transactions. Categorize your spending.
- **Navigation:** Use the sleek navbar to switch between dashboard and transactions.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License
[MIT](LICENSE)

---

<<<<<<< HEAD
**vint.** — Track your finances beautifully. 
=======
**vint.** — Track your finances beautifully. 
>>>>>>> 63891bd (Plaid functionality 90% done!)
