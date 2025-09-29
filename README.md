Sande Family Portal
A family portal for the Sande Family to connect, share memories, and stay updated with events and news.
Features

User authentication (signup, login, logout) with JWT and bcrypt.
Protected routes for accessing the main family website.
SQLite3 database (family_members.db) for storing user data.
Automated backups of the database in the backups folder after each signup.
Responsive frontend with sign-in/sign-up and family content pages.
Deployable on Vercel.

Setup

Clone the repository:
git clone <repository-url>
cd sande-family


Install dependencies:
npm install


Set up environment variables:Create a .env file in the root directory:
JWT_SECRET=your-secure-secret-here-1234567890
PORT=5000


Run the server:

Development: npm run dev (uses nodemon)
Production: npm start


Access the application:

Open http://localhost:5000/auth for sign-in/sign-up.
After authentication, access http://localhost:5000 for the main website.



File Structure

server.js: Main server with Express and SQLite3.
family_members.db: SQLite database for user data.
backups/: Directory for database backups (e.g., backup_<timestamp>.db).
public/auth.html: Sign-in/sign-up page.
public/index.html: Main family website.
public/dashboard.html: Dashboard for authenticated users.
public/style.css: Styles for all pages.
public/app.js: Client-side JavaScript for authentication.
vercel.json: Vercel deployment configuration.

Database

The family_members.db file stores user data in a users table (id, name, email, password, createdAt).
Backups are automatically created in the backups folder after each signup.

Deployment

Deploy to Vercel using the vercel.json configuration.
Ensure environment variables are set in Vercel.
Copy the family_members.db file to the deployment environment if existing user data is needed.

Notes

Social login (Google, Facebook) buttons are present in auth.html but not implemented in the backend.
Add a sande-family-logo.png in the public directory for the gallery section.
Ensure the backups folder is included in backups or version control if needed.

License
ISC