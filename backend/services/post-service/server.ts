import express from 'express';
import bodyParser from 'body-parser';
import postRoutes from './src/routes/postRoutes';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(bodyParser.json());
app.use('/', postRoutes);
app.get('/', (req, res) => res.send('Post service running'));

app.listen(PORT, () => console.log(`Post service listening on ${PORT}`));