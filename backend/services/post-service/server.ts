import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import postRoutes from './src/routes/postRoutes';

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mount routes at /api/posts
app.use('/api/posts', postRoutes);

// Health check
app.get('/', (req, res) => res.send('Post service running'));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'post-service' }));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Post service listening on ${PORT}`));