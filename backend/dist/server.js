"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const initDb_1 = require("./utils/initDb");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const accounts_1 = __importDefault(require("./routes/accounts"));
const categories_1 = __importDefault(require("./routes/categories"));
const transactions_1 = __importDefault(require("./routes/transactions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Simple CORS configuration for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});
app.use(express_1.default.json({ limit: '10mb' })); // Add size limit for security
// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'None'}`);
    next();
});
// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/accounts', accounts_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/transactions', transactions_1.default);
app.get('/api/health', (req, res) => {
    res.json({ message: 'Finance Tracker API is running!' });
});
// Debug route to list available routes
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
        else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request entity too large' });
    }
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        return res.status(400).json({ error: 'Invalid JSON format' });
    }
    return res.status(500).json({ error: 'Internal server error' });
});
// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Initialize database and start server
const startServer = async () => {
    try {
        await (0, initDb_1.initializeDatabase)();
        console.log('Database initialized successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
            console.log(`🌐 CORS enabled for: http://localhost:5173`);
            console.log(`💾 Database: SQLite initialized`);
        });
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map