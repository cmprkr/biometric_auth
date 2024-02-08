const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const users = {}; // This will act as a simple in-memory "database"

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Routes to serve the HTML files
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/views/signup.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users = readUsers(); // Read current users
    users[username] = hashedPassword; // Add or overwrite the user
    writeUsers(users); // Write back to the file
    
    res.redirect('/login'); // Redirect to the login page after signup
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers(); // Read current users
    
    if (users[username] && await bcrypt.compare(password, users[username])) {
        res.send('Login Successful');
    } else {
        res.send('Login Failed');
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users file:', err);
        return {};
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing users file:', err);
    }
}