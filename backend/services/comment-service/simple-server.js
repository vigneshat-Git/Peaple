const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(bodyParser.json());

// Mock authentication middleware
const authenticate = (req, res, next) => {
  // For now, skip authentication and add mock user
  // In production, this would validate JWT tokens
  req.user = {
    userId: 'a3b4ddd2-c9d5-45e5-9630-03c6782f4f71', // Mock user ID
    username: 'test_user'
  };
  next();
};

// Mock data for now - replace with actual database later
let comments = [
  {
    id: '1',
    post_id: 'bc35a0f2-a4dc-49d0-9cc0-99cd47d7dce4',
    author_id: 'a3b4ddd2-c9d5-45e5-9630-03c6782f4f71',
    content: 'Great post! This is working well.',
    created_at: new Date().toISOString(),
    votes_count: 5
  }
];

// GET /posts/:id/comments - Get comments for a specific post
app.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  console.log(`Fetching comments for post: ${id}`);
  const postComments = comments.filter(comment => comment.post_id === id);
  res.json(postComments);
});

// POST /comments - Create a new comment
app.post('/comments', authenticate, (req, res) => {
  const { postId, parentCommentId, content } = req.body;
  const user = req.user;
  
  console.log('Creating comment:', { postId, parentCommentId, content, userId: user.userId });
  
  if (!postId || !content) {
    return res.status(400).json({ message: 'postId and content are required' });
  }

  const newComment = {
    id: Math.random().toString(36).substring(2, 10),
    post_id: postId,
    author_id: user.userId,
    parent_comment_id: parentCommentId || null,
    content,
    created_at: new Date().toISOString(),
    votes_count: 0
  };

  comments.push(newComment);
  console.log('Created comment:', newComment);
  res.status(201).json({ id: newComment.id });
});

// DELETE /comments/:id - Delete a comment
app.delete('/comments/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const user = req.user;
  
  const commentIndex = comments.findIndex(comment => 
    comment.id === id && comment.author_id === user.userId
  );
  
  if (commentIndex === -1) {
    return res.status(404).json({ message: 'Not found or unauthorized' });
  }
  
  comments.splice(commentIndex, 1);
  res.json({ message: 'Deleted' });
});

// Also handle the direct API paths for gateway compatibility
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  console.log(`Fetching comments for post (direct API path): ${id}`);
  const postComments = comments.filter(comment => comment.post_id === id);
  res.json(postComments);
});

app.post('/api/comments', authenticate, (req, res) => {
  const { postId, parentCommentId, content } = req.body;
  const user = req.user;
  
  if (!postId || !content) {
    return res.status(400).json({ message: 'postId and content are required' });
  }

  const newComment = {
    id: Math.random().toString(36).substring(2, 10),
    post_id: postId,
    author_id: user.userId,
    parent_comment_id: parentCommentId || null,
    content,
    created_at: new Date().toISOString(),
    votes_count: 0
  };

  comments.push(newComment);
  res.status(201).json({ id: newComment.id });
});

app.delete('/api/comments/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const user = req.user;
  
  const commentIndex = comments.findIndex(comment => 
    comment.id === id && comment.author_id === user.userId
  );
  
  if (commentIndex === -1) {
    return res.status(404).json({ message: 'Not found or unauthorized' });
  }
  
  comments.splice(commentIndex, 1);
  res.json({ message: 'Deleted' });
});

app.get('/', (req, res) => res.send('Comment service running'));

app.listen(PORT, () => {
  console.log(`Comment service listening on ${PORT}`);
});
