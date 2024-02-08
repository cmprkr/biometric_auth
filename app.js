const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const users = {}; // This will act as a simple in-memory "database"

const { generateAuthenticationOptions, verifyAuthenticationResponse, generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');

// Import this if not already done
app.use(bodyParser.json());

// Example in-memory storage for demo purposes
const userStorage = {};

app.use(express.static('public')); // Make sure this is already in your app.js

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

app.post('/webauthn/register/start', (req, res) => {
    const options = generateRegistrationOptions({
        rpName: "Example Corp", // Replace with your site's name
        userID: "YOUR_USER_ID", // Replace with the current user's ID
        userName: "YOUR_USER_NAME", // Replace with the current user's username
        // Include other options as needed
    });

    // Store options in session or a temporary storage to retrieve them later
    // For simplicity, storing in an in-memory object
    userStorage.tempChallenge = options.challenge;

    res.json(options);
});

app.post('/webauthn/register/finish', (req, res) => {
    const { challenge } = userStorage.tempChallenge;
    const credential = req.body;

    // Perform necessary conversions for types, not shown here for brevity

    try {
        const verification = verifyRegistrationResponse({
            credential,
            expectedChallenge: challenge,
            expectedOrigin: "http://localhost:3000", // Adjust for production
            expectedRPID: "localhost",
        });

        if (verification.verified) {
            // Save registration details to userStorage or your database
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Verification failed" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/webauthn/login/start', (req, res) => {
    const options = generateAuthenticationOptions({
        // Adjust options as needed
        allowCredentials: [{
            id: userStorage.savedCredentialID, // Retrieve this from where you stored it during registration
            type: 'public-key',
            transports: ['internal'],
        }],
    });

    userStorage.tempChallenge = options.challenge;

    res.json(options);
});

app.post('/webauthn/login/finish', (req, res) => {
    const { challenge } = userStorage.tempChallenge;
    const credential = req.body;

    try {
        const verification = verifyAuthenticationResponse({
            credential,
            expectedChallenge: challenge,
            expectedOrigin: "http://localhost:3000",
            expectedRPID: "localhost",
            authenticator: userStorage.authenticatorData, // Use the authenticator data saved during registration
        });

        if (verification.verified) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Authentication failed" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});