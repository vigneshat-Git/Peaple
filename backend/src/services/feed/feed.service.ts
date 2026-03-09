import { query } from '../../config/database.js';
import { Post } from '../../types/index.js';
import { getPaginationParams, calculatePostScore } from '../../utils/helpers.js';
import { getCacheOrFetch, invalidateCache } from '../../config/redis.js';

export class FeedService {
  async generateUserFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
    sort: 'trending' | 'new' | 'hot' = 'trending'
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const cacheKey = `feed:${userId}:${sort}:${page}`;

      return await getCacheOrFetch(
        cacheKey,
        async () => {
          const { offset } = getPaginationParams(page, limit);

          // Get user's community memberships
          const userCommunitiesResult = await query(
            `SELECT community_id FROM community_members WHERE user_id = $1`,
            [userId]
          );

          const communityIds = userCommunitiesResult.rows.map((r) => r.community_id);

          if (communityIds.length === 0) {
            // If user hasn't joined any communities, show trending posts
            return this.getTrendingFeed(page, limit);
          }

          const placeholders = communityIds.map((_, i) => `$${i + 1}`).join(',');

          let orderBy = 'score DESC';
          if (sort === 'new') {
            orderBy = 'created_at DESC';
          } else if (sort === 'hot') {
            orderBy = 'score DESC';
          }

          const totalResult = await query(
            `SELECT COUNT(*) FROM posts WHERE community_id IN (${placeholders})`,
            communityIds
          );
          const total = parseInt(totalResult.rows[0].count, 10);

          const result = await query(
            `SELECT * FROM posts
             WHERE community_id IN (${placeholders})
             ORDER BY ${orderBy}
             LIMIT $${communityIds.length + 1} OFFSET $${communityIds.length + 2}`,
            [...communityIds, limit, offset]
          );

          return {
            posts: result.rows,
            total,
            page,
            limit,
          };
        },
        300 // Cache for 5 minutes
      );
    } catch (error) {
      throw error;
    }
  }

  async getTrendingFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const cacheKey = `feed:trending:${page}`;

      return await getCacheOrFetch(
        cacheKey,
        async () => {
          const { offset } = getPaginationParams(page, limit);

          const totalResult = await query(
            `SELECT COUNT(*) FROM posts
             WHERE created_at > NOW() - INTERVAL '7 days'`
          );
          const total = parseInt(totalResult.rows[0].count, 10);

          const result = await query(
            `SELECT * FROM posts
             WHERE created_at > NOW() - INTERVAL '7 days'
             ORDER BY score DESC, created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
          );

          return {
            posts: result.rows,
            total,
            page,
            limit,
          };
        },
        300
      );
    } catch (error) {
      throw error;
    }
  }

  async getNewFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const cacheKey = `feed:new:${page}`;

      return await getCacheOrFetch(
        cacheKey,
        async () => {
          const { offset } = getPaginationParams(page, limit);

          const totalResult = await query('SELECT COUNT(*) FROM posts');
          const total = parseInt(totalResult.rows[0].count, 10);

          const result = await query(
            `SELECT * FROM posts
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
          );

          return {
            posts: result.rows,
            total,
            page,
            limit,
          };
        },
        300
      );
    } catch (error) {
      throw error;
    }
  }

  async getCommunityFeed(
    communityId: string,
    page: number = 1,
    limit: number = 20,
    sort: 'new' | 'trending' | 'hot' = 'trending'
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const cacheKey = `community:${communityId}:feed:${sort}:${page}`;

      return await getCacheOrFetch(
        cacheKey,
        async () => {
          const { offset } = getPaginationParams(page, limit);

          let orderBy = 'score DESC';
          if (sort === 'new') {
            orderBy = 'created_at DESC';
          }

          const totalResult = await query(
            'SELECT COUNT(*) FROM posts WHERE community_id = $1',
            [communityId]
          );
          const total = parseInt(totalResult.rows[0].count, 10);

          const result = await query(
            `SELECT * FROM posts
             WHERE community_id = $1
             ORDER BY ${orderBy}
             LIMIT $2 OFFSET $3`,
            [communityId, limit, offset]
          );

          return {
            posts: result.rows,
            total,
            page,
            limit,
          };
        },
        300
      );
    } catch (error) {
      throw error;
    }
  }

  async recalculateAllPostScores(): Promise<void> {
    try {
      const result = await query('SELECT id, created_at, upvotes, downvotes FROM posts');

      for (const post of result.rows) {
        const score = calculatePostScore(post.upvotes, post.downvotes, post.created_at);
        await query('UPDATE posts SET score = $1 WHERE id = $2', [score, post.id]);
      }

      await invalidateCache('feed:*');
      console.log('Post scores recalculated');
    } catch (error) {
      console.error('Error recalculating scores:', error);
      throw error;
    }
  }

  async getHotPosts(
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const cacheKey = `feed:hot:${page}`;

      return await getCacheOrFetch(
        cacheKey,
        async () => {
          const { offset } = getPaginationParams(page, limit);

          const totalResult = await query(
            `SELECT COUNT(*) FROM posts
             WHERE created_at > NOW() - INTERVAL '24 hours'`
          );
          const total = parseInt(totalResult.rows[0].count, 10);

          const result = await query(
            `SELECT * FROM posts
             WHERE created_at > NOW() - INTERVAL '24 hours'
             ORDER BY score DESC, created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
          );

          return {
            posts: result.rows,
            total,
            page,
            limit,
          };
        },
        300
      );
    } catch (error) {
      throw error;
    }
  }

  async getPersonalizedFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      // Get user's top communities by activity
      const result = await query(
        `SELECT c.id FROM communities c
         JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = $1
         ORDER BY c.member_count DESC
         LIMIT 10`,
        [userId]
      );

      const topCommunities = result.rows.map((r) => r.id);

      if (topCommunities.length === 0) {
        return this.getTrendingFeed(page, limit);
      }

      // Weight posts from user's communities higher
      const { offset } = getPaginationParams(page, limit);
      const placeholders = topCommunities
        .map((_, i) => `$${i + 1}`)
        .join(',');

      const totalResult = await query(
        `SELECT COUNT(*) FROM posts WHERE community_id IN (${placeholders})`,
        topCommunities
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const postsResult = await query(
        `SELECT * FROM posts
         WHERE community_id IN (${placeholders})
         ORDER BY score DESC, created_at DESC
         LIMIT $${topCommunities.length + 1} OFFSET $${topCommunities.length + 2}`,
        [...topCommunities, limit, offset]
      );

      return {
        posts: postsResult.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const feedService = new FeedService();
