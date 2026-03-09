import express from 'express';
import bodyParser from 'body-parser';
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
