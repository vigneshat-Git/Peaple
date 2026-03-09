import express from 'express';
import bodyParser from 'body-parser';
import communityRoutes from './src/routes/communityRoutes';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(bodyParser.json());
app.use('/communities', communityRoutes);

app.get('/', (req, res) => res.send('Community service running'));

app.listen(PORT, () => {
  console.log(`Community service listening on ${PORT}`);
});