require('dotenv').config(); // Add this line to load environment variables

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
});

const User = mongoose.model('User', userSchema);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Set the view engine to EJS
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Routes
app.get('/', requireLogin, (req, res) => {
    res.send('Welcome to the blog!');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
        role,
    });

    await newUser.save();
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/login');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
