# Peaple Backend - Frontend Integration Guide

This guide explains how to integrate the Peaple backend with your frontend application.

## Frontend Setup

### 1. Install HTTP Client

Use either Axios or Fetch API:

```bash
# Using Axios (recommended)
npm install axios

# Or use native Fetch API (built-in)
```

### 2. Create API Service

**Using Axios:**
```typescript
// lib/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          localStorage.setItem('access_token', data.data.access_token);
          return apiClient(error.config);
        } catch (err) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Authentication Flow

```typescript
// lib/auth.ts
import apiClient from './api';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  access_token: string;
  refresh_token: string;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/register', {
    username,
    email,
    password,
  });
  return data.data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
}
```

### 4. Store Tokens

```typescript
// utils/storage.ts
export const setAuthTokens = (
  accessToken: string,
  refreshToken: string
) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const getAuthTokens = () => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
```

## Example Components

### Login Component
```typescript
// components/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/auth';
import { setAuthTokens } from '../utils/storage';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { access_token, refresh_token } = await login(email, password);
      setAuthTokens(access_token, refresh_token);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Communities List Component
```typescript
// components/CommunitiesList.tsx
import { useEffect, useState } from 'react';
import apiClient from '../lib/api';

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const { data } = await apiClient.get('/communities?limit=20');
        setCommunities(data.data);
      } catch (err) {
        console.error('Failed to fetch communities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading communities...</p>
      ) : (
        <div>
          {communities.map((community) => (
            <div key={community.id} className="community-card">
              <h3>{community.name}</h3>
              <p>{community.description}</p>
              <p>{community.member_count} members</p>
              <button>Join</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Feed Component
```typescript
// components/Feed.tsx
import { useEffect, useState } from 'react';
import apiClient from '../lib/api';

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data } = await apiClient.get(
          `/feed/me?page=${page}&limit=20&sort=trending`
        );
        setPosts(data.data);
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      }
    }

    fetchFeed();
  }, [page]);

  async function handleUpvote(postId: string) {
    try {
      await apiClient.post(`/votes/post/${postId}`, {
        vote_type: 'upvote',
      });
      // Refresh feed or update post in state
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  }

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <div className="post-stats">
            <button onClick={() => handleUpvote(post.id)}>
              👍 {post.upvotes}
            </button>
            <button disabled>👎 {post.downvotes}</button>
            <span>💬 {post.comment_count}</span>
          </div>
        </article>
      ))}
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
```

## Environment Variables

**.env.local**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**For production:**
```env
REACT_APP_API_URL=https://your-railway-domain.up.railway.app/api
```

## Error Handling

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any) {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Show permission error
    return 'You do not have permission to perform this action';
  } else if (error.response?.status === 404) {
    return 'Resource not found';
  } else if (error.response?.status === 429) {
    return 'Too many requests. Please try again later.';
  } else {
    return error.response?.data?.error || 'An error occurred';
  }
}
```

## CORS Configuration

The backend is configured with CORS for the frontend URL:

```env
FRONTEND_URL=http://localhost:3000  # Development
FRONTEND_URL=https://your-vercel-domain.vercel.app  # Production
```

## Deployment Checklist

- [ ] API_BASE_URL environment variable set correctly
- [ ] JWT tokens stored securely (httpOnly cookies recommended for production)
- [ ] Error handling implemented for all API calls
- [ ] Loading states shown to users
- [ ] Token refresh logic working
- [ ] CORS headers properly configured
- [ ] API rate limiting handled gracefully

## Real-time Updates (Future)

To add real-time features using WebSockets:

```typescript
// utils/socket.ts
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL);

socket.on('new-post', (post) => {
  // Handle new post
});

socket.on('new-comment', (comment) => {
  // Handle new comment
});
```

## Performance Optimization

```typescript
// Use React Query for caching and synchronization
import { useQuery } from '@tanstack/react-query';

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => apiClient.get('/feed/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

For more information, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
