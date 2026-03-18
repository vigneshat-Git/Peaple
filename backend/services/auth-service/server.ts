import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import authRoutes from './src/routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Auth service is running');
});

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});
