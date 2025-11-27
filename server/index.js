
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Setup path for local database file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Enable CORS
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

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const generateToken = () => crypto.randomBytes(32).toString('hex');

// --- AUTHENTICATION MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Invalid token format' });
    }

    const db = readDB();
    // Simple session cleanup (remove expired sessions)
    const now = Date.now();
    db.sessions = db.sessions.filter(s => s.expiresAt > now);
    writeDB(db);

    const session = db.sessions.find(s => s.token === token);
    
    if (!session) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.userId = session.userId;
    next();
};

// --- AUTH ROUTES ---

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const db = readDB();
    
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashPassword(password),
        title: 'Free Plan',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    
    // Auto login
    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    db.sessions.push({ token, userId: newUser.id, expiresAt });
    
    writeDB(db);
    
    res.status(201).json({ 
        user: { id: newUser.id, name: newUser.name, email: newUser.email, title: newUser.title, avatar: newUser.avatar }, 
        token 
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    
    const user = db.users.find(u => u.email === email && u.password === hashPassword(password));
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    db.sessions.push({ token, userId: user.id, expiresAt });
    writeDB(db);

    res.json({ 
        user: { id: user.id, name: user.name, email: user.email, title: user.title, avatar: user.avatar }, 
        token 
    });
});

app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const db = readDB();
        db.sessions = db.sessions.filter(s => s.token !== token);
        writeDB(db);
    }
    res.json({ success: true });
});

app.get('/api/user', authenticate, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.put('/api/user', authenticate, (req, res) => {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.userId);
    
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const { name, title, avatar } = req.body;
    
    // Only update allowed fields
    db.users[userIndex] = {
        ...db.users[userIndex],
        name: name || db.users[userIndex].name,
        title: title || db.users[userIndex].title,
        avatar: avatar || db.users[userIndex].avatar
    };
    
    writeDB(db);
    
    const { password, ...userWithoutPassword } = db.users[userIndex];
    res.json(userWithoutPassword);
});

// --- GENERIC CRUD HANDLERS ---
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
                userId: req.userId, 
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
            const index = list.findIndex(item => item.id === req.params.id && item.userId === req.userId);
            if (index === -1) return res.status(404).json({ message: 'Not found' });

            const { userId, id, createdAt, ...updates } = req.body;
            list[index] = { ...list[index], ...updates };
            db[collectionName] = list;
            writeDB(db);
            res.json(list[index]);
        },
        delete: (req, res) => {
            const db = readDB();
            const list = db[collectionName] || [];
            const filteredList = list.filter(item => !(item.id === req.params.id && item.userId === req.userId));
            if (list.length === filteredList.length) return res.status(404).json({ message: 'Not found' });

            db[collectionName] = filteredList;
            writeDB(db);
            res.json({ success: true });
        }
    };
};

const contacts = createHandlers('contacts');
const leads = createHandlers('leads');
const tasks = createHandlers('tasks');
const events = createHandlers('events');
const documents = createHandlers('documents');
const emails = createHandlers('emails');

app.get('/', (req, res) => res.send('CRM API is running!'));

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
