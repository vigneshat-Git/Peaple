import express from 'express';
import bodyParser from 'body-parser';
import feedRoutes from './src/routes/feedRoutes';

const app = express();
const PORT = process.env.PORT || 4006;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Request logging
app.use((req, res, next) => {
  console.log(`[Feed Service] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(bodyParser.json());
app.use('/feed', feedRoutes);

app.get('/', (req, res) => res.send('Feed service running'));

// 404 handler
app.use((req, res) => {
  console.log(`[Feed Service] 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    service: 'feed-service'
  });
});

app.listen(PORT, () => console.log(`Feed service listening on ${PORT}`));