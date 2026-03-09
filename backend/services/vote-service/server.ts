import express from 'express';
import bodyParser from 'body-parser';
import voteRoutes from './src/routes/voteRoutes';

const app = express();
const PORT = process.env.PORT || 4005;

app.use(bodyParser.json());
app.use('/', voteRoutes);
app.get('/', (req, res) => res.send('Vote service running'));

app.listen(PORT, () => console.log(`Vote service listening on ${PORT}`));