
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
// Changed default port to 10000 to match the user's running configuration
const PORT = process.env.PORT || 10000;

// Setup path for local database file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Enable CORS for all origins to ensure Vercel frontend can connect to Render backend
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const INITIAL_DATA = {
    users: [],
    sessions: [],
    contacts: [],
    leads: [],
    tasks: [],
    events: [],
    documents: [],
    emails: []
};

// --- FILE DB INITIALIZATION ---
// This acts as a simple NoSQL document store using a JSON file.
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    console.log('📁 Created new local database file: db.json');
}

// --- HELPERS ---
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        
        let needsSave = false;
        
        // Ensure all required collections exist
        const collections = ['users', 'sessions', 'contacts', 'leads', 'tasks', 'events', 'documents', 'emails'];
        collections.forEach(key => {
            if (!parsed[key]) {
                parsed[key] = [];
                needsSave = true;
            }
        });

        if (needsSave) {
            fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
        }

        return parsed;
    } catch (err) {
        console.error("Error reading DB:", err);
        return INITIAL_DATA;
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing DB:", err);
    }
};

// Security: Hash passwords using SHA-256 before storing them.
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

// Generate a random 32-byte hex token for session management
const generateToken = () => crypto.randomBytes(32).toString('hex');

// --- AUTHENTICATION MIDDLEWARE ---
// This middleware intercepts protected requests, validates the bearer token,
// and attaches the `userId` to the request object for data isolation.
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    // Expecting "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Malformed token' });

    const db = readDB();
    
    // Session Garbage Collection: Remove expired sessions
    const now = Date.now();
    const activeSessions = db.sessions.filter(s => s.expires > now);
    
    // Optimistic write: Only update DB if we actually removed something to save I/O
    if (activeSessions.length !== db.sessions.length) {
        db.sessions = activeSessions;
        writeDB(db);
    }

    const session = activeSessions.find(s => s.token === token);

    if (!session) return res.status(401).json({ message: 'Invalid or expired token' });

    // Success: Attach User ID to request so subsequent handlers know who owns the data
    req.userId = session.userId;
    next();
};

// --- AUTH ROUTES ---

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const db = readDB();
    
    // Check if user exists
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashPassword(password), // Store hashed password
        title: "Pro Plan",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&background=0D8ABC`
    };

    db.users.push(newUser);
    
    // Create new session
    const token = generateToken();
    db.sessions.push({ token, userId: newUser.id, expires: Date.now() + 86400000 }); // 24h Expiry
    
    writeDB(db);
    
    // Return user info without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword, token });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const db = readDB();
    const user = db.users.find(u => u.email === email && u.password === hashPassword(password));

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken();
    // Create a new session for this login
    db.sessions.push({ token, userId: user.id, expires: Date.now() + 86400000 });
    writeDB(db);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        const db = readDB();
        // Remove the specific session token
        db.sessions = db.sessions.filter(s => s.token !== token);
        writeDB(db);
    }
    res.json({ success: true });
});

// Get current user profile
app.get('/api/user', authenticate, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Update user profile
app.put('/api/user', authenticate, (req, res) => {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.userId);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    // Prevent updating critical fields like password or ID directly via this route
    const { password, id, ...updates } = req.body;
    
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    writeDB(db);

    const { password: _, ...userWithoutPassword } = db.users[userIndex];
    res.json(userWithoutPassword);
});


// --- GENERIC CRUD HANDLERS (Protected by Data Isolation) ---
// This factory function creates CRUD handlers that automatically enforce ownership checks.
// Users can only access, modify, or delete items where item.userId === req.userId.

const createHandlers = (collectionName) => {
    return {
        getAll: (req, res) => {
            const db = readDB();
            const list = db[collectionName] || [];
            // Filter by authenticated user ID (Data Isolation)
            const userItems = list.filter(item => item.userId === req.userId);
            res.json(userItems);
        },
        create: (req, res) => {
            const db = readDB();
            const newItem = { 
                id: Date.now().toString(), 
                createdAt: new Date().toISOString(), 
                userId: req.userId, // Automatically associate new item with current user
                ...req.body 
            }; 
            if (!db[collectionName]) db[collectionName] = [];
            db[collectionName].push(newItem);
            writeDB(db);
            res.status(201).json(newItem);
        },
        update: (req, res) => {
            const db = readDB();
            const list = db[collectionName] || [];
            // Ensure ownership: User can only update their own items
            const index = list.findIndex(item => item.id === req.params.id && item.userId === req.userId);
            
            if (index === -1) {
                return res.status(404).json({ message: 'Not found or access denied' });
            }

            const { userId, id, createdAt, ...updates } = req.body;
            list[index] = { ...list[index], ...updates };
            db[collectionName] = list;
            writeDB(db);
            res.json(list[index]);
        },
        delete: (req, res) => {
            const db = readDB();
            const list = db[collectionName] || [];
            // Ensure ownership before deleting
            const filteredList = list.filter(item => !(item.id === req.params.id && item.userId === req.userId));

            if (list.length === filteredList.length) {
                return res.status(404).json({ message: 'Not found or access denied' });
            }

            db[collectionName] = filteredList;
            writeDB(db);
            res.json({ success: true });
        }
    };
};

// Define handlers
const contacts = createHandlers('contacts');
const leads = createHandlers('leads');
const tasks = createHandlers('tasks');
const events = createHandlers('events');
const documents = createHandlers('documents');
const emails = createHandlers('emails');

// Register Routes
app.get('/', (req, res) => res.send('CRM API is running!'));

// Protected Routes
app.get('/api/contacts', authenticate, contacts.getAll);
app.post('/api/contacts', authenticate, contacts.create);
app.put('/api/contacts/:id', authenticate, contacts.update);
app.delete('/api/contacts/:id', authenticate, contacts.delete);

app.get('/api/leads', authenticate, leads.getAll);
app.post('/api/leads', authenticate, leads.create);
app.put('/api/leads/:id', authenticate, leads.update);
app.delete('/api/leads/:id', authenticate, leads.delete);

app.get('/api/tasks', authenticate, tasks.getAll);
app.post('/api/tasks', authenticate, tasks.create);
app.put('/api/tasks/:id', authenticate, tasks.update);
app.delete('/api/tasks/:id', authenticate, tasks.delete);

app.get('/api/events', authenticate, events.getAll);
app.post('/api/events', authenticate, events.create);
app.put('/api/events/:id', authenticate, events.update);
app.delete('/api/events/:id', authenticate, events.delete);

app.get('/api/documents', authenticate, documents.getAll);
app.post('/api/documents', authenticate, documents.create);
app.delete('/api/documents/:id', authenticate, documents.delete);

app.get('/api/emails', authenticate, emails.getAll);
app.post('/api/emails', authenticate, emails.create);
app.put('/api/emails/:id', authenticate, emails.update);
app.delete('/api/emails/:id', authenticate, emails.delete);

app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`📦 Using Local Database File: ${DB_FILE}`);
});
