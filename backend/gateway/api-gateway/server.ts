import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// services base URLs - in production these would be service hostnames
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4001';
const POST_URL = process.env.POST_URL || 'http://localhost:4003';
const COMMENT_URL = process.env.COMMENT_URL || 'http://localhost:4004';
const VOTE_URL = process.env.VOTE_URL || 'http://localhost:4005';
const FEED_URL = process.env.FEED_URL || 'http://localhost:4006';
const COMMUNITY_URL = process.env.COMMUNITY_URL || 'http://localhost:4002';

app.use(
  '/api/auth',
  createProxyMiddleware({ target: AUTH_URL, changeOrigin: true, pathRewrite: { '^/api/auth': '' } })
);
app.use(
  '/api/posts',
  createProxyMiddleware({ target: POST_URL, changeOrigin: true, pathRewrite: { '^/api/posts': '' } })
);
app.use(
  '/api/comments',
  createProxyMiddleware({ target: COMMENT_URL, changeOrigin: true, pathRewrite: { '^/api/comments': '' } })
);
app.use(
  '/api/votes',
  createProxyMiddleware({ target: VOTE_URL, changeOrigin: true, pathRewrite: { '^/api/votes': '' } })
);
app.use(
  '/api/feed',
  createProxyMiddleware({ target: FEED_URL, changeOrigin: true, pathRewrite: { '^/api/feed': '' } })
);
app.use(
  '/api/communities',
  createProxyMiddleware({ target: COMMUNITY_URL, changeOrigin: true, pathRewrite: { '^/api/communities': '' } })
);

app.get('/', (req, res) => res.send('API Gateway is up'));

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
