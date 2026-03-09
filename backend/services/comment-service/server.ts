import express from 'express';
import bodyParser from 'body-parser';
import commentRoutes from './src/routes/commentRoutes';

const app = express();
const PORT = process.env.PORT || 4004;

app.use(bodyParser.json());
app.use('/', commentRoutes);
app.get('/', (req, res) => res.send('Comment service running'));

app.listen(PORT, () => console.log(`Comment service listening on ${PORT}`));