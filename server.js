const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        'https://sande-family.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000'
    ],
    credentials: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const dbPath = path.join(__dirname, 'family_members.db');
const dbDir = path.dirname(dbPath);

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT NOT NULL,
            expires DATETIME NOT NULL
        )`);
    }
});

// Environment variables
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || '87654321';
const PORT = process.env.PORT || 5000;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Signup
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ success: false, error: 'Email already exists' });
                    }
                    return res.status(500).json({ success: false, error: 'Server error' });
                }
                res.status(201).json({ success: true, message: 'User registered successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Server error' });
        }
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });

        res.json({ success: true, message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// Auth check
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({ success: true, user: { id: req.user.id, email: req.user.email } });
});

// Profile
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, name, email, createdAt FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Server error' });
        }
        res.json({ success: true, user });
    });
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
    }

    db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Server error' });
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    });
});

// Password Reset Request
app.post('/api/reset-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Server error' });
        }
        if (!user) {
            return res.status(404).json({ success: false, error: 'Email not found' });
        }

        // Generate a reset token
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '15m' });
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        db.run(
            'INSERT INTO password_resets (email, token, expires) VALUES (?, ?, ?)',
            [email, token, expires.toISOString()],
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Server error' });
                }
                // In a real app, send an email with the reset link (e.g., `/reset-password?token=${token}`)
                // For now, return the token for frontend to handle
                res.json({ success: true, message: 'Password reset token generated', token });
            }
        );
    });
});

// Password Reset Confirmation
app.post('/api/reset-password/confirm', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const email = decoded.email;

        db.get('SELECT * FROM password_resets WHERE token = ? AND email = ?', [token, email], async (err, reset) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Server error' });
            }
            if (!reset) {
                return res.status(400).json({ success: false, error: 'Invalid or expired token' });
            }

            const expires = new Date(reset.expires);
            if (expires < new Date()) {
                return res.status(400).json({ success: false, error: 'Token has expired' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], function (err) {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Server error' });
                }
                db.run('DELETE FROM password_resets WHERE email = ?', [email], (err) => {
                    if (err) {
                        console.error('Error cleaning up reset token:', err);
                    }
                    res.json({ success: true, message: 'Password reset successfully' });
                });
            });
        });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
});

// Serve frontend routes
app.get('/', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// Catch-all route for unauthenticated users
app.get('*', (req, res) => {
    res.redirect('/auth');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});