const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const nodemailer = require('nodemailer');
const initializePassport = require('./passport-config');
const { sendTextMessage } = require('./text');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
const uri = 'mongodb://mongo:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

client.connect(async (err) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
    db = client.db('textbelt-gui');
    console.log('Connected to MongoDB');

    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

initializePassport(
    passport,
    async (usernameOrEmail) => {
        return await db.collection('users').findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });
    },
    async id => await db.collection('users').findOne({ _id: new ObjectId(id) })
);

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'textbeltgui@gmail.com',
        pass: 'tRbL~"MpMMU&Zt2'
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user with that email' });
        }
        const resetToken = uuidv4();
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        await db.collection('users').updateOne({ _id: user._id }, {
            $set: {
                resetToken,
                resetTokenExpires
            }
        });

        const resetUrl = `http://localhost:${PORT}/reset-password?token=${resetToken}`;
        const mailOptions = {
            to: email,
            from: 'your_email@gmail.com',
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            ${resetUrl}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ message: 'Error during password reset request' });
    }
});

// Handle the password reset form submission
app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await db.collection('users').findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne({ _id: user._id }, {
            $set: {
                password: hashedPassword,
                resetToken: undefined,
                resetTokenExpires: undefined
            }
        });
        res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Error during password reset' });
    }
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'No user found!' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.passport.user = user._id; // Ensure user ID is stored in the session
            return res.status(200).json({ message: 'Login successful' });
        });
    })(req, res, next);
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({ username, email, password: hashedPassword, role: 'user' });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during user registration:', error);
        if (error.code === 11000) { // Duplicate key error
            const field = Object.keys(error.keyValue)[0];
            res.status(409).json({ message: `User with this ${field} already exists` });
        } else {
            res.status(500).json({ message: 'Error registering user' });
        }
    }
});

app.post('/update-settings', async (req, res) => {
    const { apiKey } = req.body;
    const userId = req.session.passport.user; // Retrieve user ID from session
    try {
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { apiKey } });
        res.status(200).json({ message: 'API key updated successfully' });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ error: 'Failed to update API key' });
    }
});

app.get('/quota', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.passport.user; // Retrieve user ID from session
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || !user.apiKey) {
            return res.status(404).json({ error: 'User or API key not found' });
        }
        const response = await axios.get(`https://textbelt.com/quota/${user.apiKey}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching quota:', error);
        res.status(500).json({ error: 'Failed to fetch quota' });
    }
});

app.post('/send-text', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { phone, message } = req.body;
    const userId = req.session.passport.user; // Retrieve user ID from session
    const messageId = uuidv4(); // Generate a unique message ID for the batch
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const apiKey = user.apiKey;
        const phoneNumbers = phone.split(/[\n,]+/).map(p => p.trim()).filter(p => p);

        for (const number of phoneNumbers) {
            await sendTextMessage(number, message, apiKey);
            console.log(`Message sent to ${number}: ${message}`);
        }

        // Store the sent message with all phone numbers in the database
        await db.collection('messages').insertOne({
            userId: new ObjectId(userId),
            messageId,
            phones: phoneNumbers,
            message,
            date: new Date()
        });

        // Fetch updated quota information
        const response = await axios.get(`https://textbelt.com/quota/${apiKey}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error sending messages:', error);
        res.status(500).json({ error: 'Failed to send messages' });
    }
});

app.get('/auth-status', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() });
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/messages', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.passport.user; // Retrieve user ID from session
    try {
        const messages = await db.collection('messages')
            .find({ userId: new ObjectId(userId) })
            .sort({ date: -1 })
            .limit(5)
            .toArray();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/home');
    });
});

// Middleware to check if the user is an admin
function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Forbidden' });
    }
}

// Admin login route
app.post('/admin/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'No admin user found!' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.passport.user = user._id; // Ensure user ID is stored in the session
            return res.status(200).json({ message: 'Login successful' });
        });
    })(req, res, next);
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Admin auth status route
app.get('/admin/auth-status', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() && req.user && req.user.role === 'admin' });
});

// Route to get all users (admin only)
app.get('/admin/users', ensureAdmin, async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query; // Default to page 1, limit 10, and empty search
    const skip = (page - 1) * limit;
    const searchQuery = search ? { 
        $or: [
            { username: { $regex: search, $options: 'i' } }, 
            { email: { $regex: search, $options: 'i' } }
        ] 
    } : {};

    try {
        const users = await db.collection('users')
            .find(searchQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const totalUsers = await db.collection('users').countDocuments(searchQuery);
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            users,
            totalPages,
            currentPage: parseInt(page),
            totalUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Route to get a specific user (admin only)
app.get('/admin/users/:id', ensureAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});

// Route to update user details (admin only)
app.put('/admin/users/:id', ensureAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, email, apiKey, password, role } = req.body;

    try {
        const updateFields = { username, email, apiKey, role };
        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

// Route to delete a user (admin only)
app.delete('/admin/users/:id', ensureAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// Serve admin.html for admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});
