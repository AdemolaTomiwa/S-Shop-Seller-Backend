import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';

dotenv.config();

const app = express();

app.use(cors());

// Express body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Mongo DB Connection
db();

// API routes

app.get('/', (req, res) => {
   res.send('APP IS RUNNING');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/password-reset', passwordResetRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server up and running on port ${PORT}...`));
