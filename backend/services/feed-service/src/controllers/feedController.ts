import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

// Extend Express Request type for authenticated routes
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// Filter types
type FilterType = 'hot' | 'new' | 'top';

interface FeedQueryParams {
  userId?: string;
  communityId?: string;
  page: number;
  limit: number;
  filter: FilterType;
}

// Ranking formula: score = (upvotes - downvotes) + recencyBoost + randomness + personalization
// recencyBoost = 1 / (hours_since_post + 2)
const buildFeedQuery = (params: FeedQueryParams) => {
  const { userId, communityId, page, limit, filter } = params;
  const offset = (page - 1) * limit;

  // Base query with SQL-based scoring (performance optimized)
  let query = `
    WITH post_scores AS (
      SELECT 
        p.id,
        p.title,
        p.content,
        p.author_id,
        p.community_id,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.created_at,
        p.updated_at,
        c.name as community_name,
        u.username as author_username,
        u.profile_image as author_avatar,
        -- Base score: (upvotes - downvotes) + recency boost
        (p.upvotes - p.downvotes + 
          (1.0 / (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2))
        ) as base_score,
        -- Randomness factor (0 to 0.5) for anti-static feed
        (RANDOM() * 0.5) as random_factor,
        -- Personalization score
        ${userId ? `
          (CASE 
            WHEN EXISTS (
              SELECT 1 FROM community_members cm 
              WHERE cm.user_id = $1 AND cm.community_id = p.community_id
            ) THEN 3
            ELSE 0
          END) + 
          (CASE 
            WHEN EXISTS (
              SELECT 1 FROM votes v 
              WHERE v.user_id = $1 AND v.post_id = p.id AND v.value = 1
            ) THEN 2
            ELSE 0
          END)
        ` : '0'}
        as personalization_score,
        -- Media aggregation
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'url', m.url,
              'type', m.type,
              'file_name', m.file_name
            ) ORDER BY m.created_at
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM posts p
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN media m ON p.id = m.post_id
      WHERE 1=1
  `;

  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (userId) {
    queryParams.push(userId);
    paramIndex++;
  }

  if (communityId) {
    query += ` AND p.community_id = $${paramIndex}`;
    queryParams.push(communityId);
    paramIndex++;
  }

  query += `
      GROUP BY p.id, c.name, u.username, u.profile_image
    ),
    ranked_posts AS (
      SELECT 
        *,
        (base_score + random_factor + personalization_score) as final_score,
        CASE 
          WHEN base_score > 10 AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 < 24 THEN 'hot'
          WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 < 48 THEN 'trending'
          ELSE 'top'
        END as trending_category
      FROM post_scores
    )
    SELECT 
      id, title, content, author_id, community_id,
      community_name, author_username, author_avatar,
      upvotes, downvotes, comment_count,
      created_at, updated_at, media,
      base_score, personalization_score, random_factor,
      final_score, trending_category
    FROM ranked_posts
  `;

  // Filter-based ordering
  switch (filter) {
    case 'hot':
      query += ` ORDER BY final_score DESC, created_at DESC`;
      break;
    case 'new':
      query += ` ORDER BY created_at DESC`;
      break;
    case 'top':
      query += ` ORDER BY upvotes DESC, created_at DESC`;
      break;
    default:
      query += ` ORDER BY final_score DESC, created_at DESC`;
  }

  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  return { query, queryParams };
};

const buildCountQuery = (params: FeedQueryParams) => {
  const { communityId } = params;
  let query = `SELECT COUNT(*) as total FROM posts p WHERE 1=1`;
  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (communityId) {
    query += ` AND p.community_id = $${paramIndex}`;
    queryParams.push(communityId);
  }

  return { query, queryParams };
};

/**
 * GET /api/posts/feed
 * Main feed endpoint with ranking, personalization, and filters
 * Query: userId?, communityId?, filter?, page?, limit?
 */
export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const communityId = req.query.communityId as string | undefined;
    const filter = (req.query.filter as FilterType) || 'hot';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { query, queryParams } = buildFeedQuery({ userId, communityId, page, limit, filter });
    const result = await pool.query(query, queryParams);

    const { query: countQuery, queryParams: countParams } = buildCountQuery({ userId, communityId, page, limit, filter });
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: { id: post.author_id, username: post.author_username, avatar: post.author_avatar },
      community: { id: post.community_id, name: post.community_name },
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      media: post.media,
      createdAt: post.created_at,
      score: parseFloat(post.final_score || post.base_score).toFixed(3),
      trendingCategory: post.trending_category
    }));

    res.json({ posts, pagination: { page, limit, total, hasMore: page * limit < total }, filter, personalized: !!userId });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

/**
 * GET /api/posts/trending
 * Alias for hot filter
 */
export const getTrending = async (req: Request, res: Response) => {
  req.query.filter = 'hot';
  return getFeed(req, res);
};

/**
 * GET /api/posts/community/:communityId
 * Community-specific feed with ranking
 */
export const getCommunityFeed = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const userId = req.query.userId as string | undefined;
    const filter = (req.query.filter as FilterType) || 'hot';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { query, queryParams } = buildFeedQuery({ userId, communityId, page, limit, filter });
    const result = await pool.query(query, queryParams);

    const countResult = await pool.query(`SELECT COUNT(*) as total FROM posts WHERE community_id = $1`, [communityId]);
    const total = parseInt(countResult.rows[0].total);

    const posts = result.rows.map(post => ({
      id: post.id, title: post.title, content: post.content,
      author: { id: post.author_id, username: post.author_username, avatar: post.author_avatar },
      community: { id: post.community_id, name: post.community_name },
      upvotes: post.upvotes, downvotes: post.downvotes, commentCount: post.comment_count,
      media: post.media, createdAt: post.created_at,
      score: parseFloat(post.final_score || post.base_score).toFixed(3),
      trendingCategory: post.trending_category
    }));

    res.json({ posts, pagination: { page, limit, total, hasMore: page * limit < total }, communityId, filter, personalized: !!userId });
  } catch (err) {
    console.error('Community feed error:', err);
    res.status(500).json({ error: 'Failed to fetch community feed' });
  }
};
