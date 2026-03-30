import express from 'express';
import bodyParser from 'body-parser';
import feedRoutes from './src/routes/feedRoutes';

const app = express();
const PORT = process.env.PORT || 4006;

app.use(bodyParser.json());
app.use('/feed', feedRoutes);
app.get('/', (req, res) => res.send('Feed service running'));

app.listen(PORT, () => console.log(`Feed service listening on ${PORT}`));