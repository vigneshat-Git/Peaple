import { query, transaction } from '../../config/database.js';
import { Post, CreatePostRequest } from '../../types/index.js';
import { generateId, getPaginationParams, calculatePostScore } from '../../utils/helpers.js';
import { invalidateCache } from '../../config/redis.js';

export class PostService {
  async createPost(
    title: string,
    content: string,
    authorId: string,
    communityId: string,
    mediaUrl?: string,
    media?: Array<{ type: string; url: string; fileName?: string }>
  ): Promise<Post> {
    try {
      const postId = generateId();

      console.log('Creating post with media:', media);

      // If media array provided, store first item's URL as media_url and rest as JSON
      const primaryMediaUrl = media && media.length > 0 ? media[0].url : mediaUrl;
      
      const result = await query(
        `INSERT INTO posts (id, title, content, author_id, community_id, media_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [postId, title, content, authorId, communityId, primaryMediaUrl]
      );

      const post = result.rows[0];

      // If media array provided, insert records into media table
      if (media && media.length > 0) {
        console.log('Inserting media records:', media);
        for (const item of media) {
          await query(
            `INSERT INTO media (post_id, url, type, file_name)
             VALUES ($1, $2, $3, $4)`,
            [postId, item.url, item.type, item.fileName || null]
          );
        }
        post.media = media;
      }

      // Invalidate cache
      await invalidateCache('feed:*');
      await invalidateCache(`community:${communityId}:posts:*`);

      console.log('Post created with media:', post);

      return post;
    } catch (error) {
      throw error;
    }
  }

  async getPostById(postId: string): Promise<Post | null> {
    try {
      const result = await query(
        `SELECT 
          posts.*,
          users.username AS author_username,
          users.id AS author_user_id,
          communities.name AS community_name,
          communities.id AS community_id_ref
         FROM posts
         JOIN users ON posts.author_id = users.id
         JOIN communities ON posts.community_id = communities.id
         WHERE posts.id = $1`,
        [postId]
      );

      if (!result.rows[0]) return null;

      const post = result.rows[0];

      // Fetch media for this post
      const mediaResult = await query(
        `SELECT url, type, file_name as fileName FROM media WHERE post_id = $1 ORDER BY created_at`,
        [postId]
      );
      post.media = mediaResult.rows;

      return {
        ...post,
        author: {
          id: post.author_user_id,
          username: post.author_username
        },
        community: {
          id: post.community_id_ref,
          name: post.community_name
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getPosts(
    page: number = 1,
    limit: number = 20,
    sort: 'new' | 'trending' | 'hot' = 'new'
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      let orderBy = 'posts.created_at DESC';
      if (sort === 'trending' || sort === 'hot') {
        orderBy = 'posts.score DESC, posts.created_at DESC';
      }

      const totalResult = await query('SELECT COUNT(*) FROM posts');
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT 
          posts.*,
          users.username AS author_username,
          users.id AS author_user_id,
          communities.name AS community_name,
          communities.id AS community_id_ref
         FROM posts
         JOIN users ON posts.author_id = users.id
         JOIN communities ON posts.community_id = communities.id
         ORDER BY ${orderBy}
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const posts = result.rows.map(post => ({
        ...post,
        author: {
          id: post.author_user_id,
          username: post.author_username
        },
        community: {
          id: post.community_id_ref,
          name: post.community_name
        }
      }));

      return {
        posts,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPostsByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        'SELECT COUNT(*) FROM posts WHERE author_id = $1',
        [authorId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT * FROM posts
         WHERE author_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [authorId, limit, offset]
      );

      return {
        posts: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCommunityPosts(
    communityId: string,
    page: number = 1,
    limit: number = 20,
    sort: 'new' | 'trending' | 'hot' = 'new'
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        'SELECT COUNT(*) FROM posts WHERE community_id = $1',
        [communityId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      let orderBy = 'created_at DESC';
      if (sort === 'trending' || sort === 'hot') {
        orderBy = 'score DESC, created_at DESC';
      }

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
    } catch (error) {
      throw error;
    }
  }

  async updatePost(
    postId: string,
    authorId: string,
    updates: Partial<Post>
  ): Promise<Post> {
    try {
      // Verify ownership
      const post = await this.getPostById(postId);
      if (!post || post.author_id !== authorId) {
        throw new Error('Unauthorized');
      }

      const allowedFields = ['title', 'content', 'media_url'];
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key as any) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(postId);

      const result = await query(
        `UPDATE posts
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        updateValues
      );

      // Invalidate cache
      await invalidateCache(`post:${postId}:*`);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      // Verify ownership
      const post = await this.getPostById(postId);
      if (!post || post.author_id !== authorId) {
        throw new Error('Unauthorized');
      }

      await transaction(async (client) => {
        // Delete associated votes and comments
        await client.query('DELETE FROM votes WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);

        // Delete post
        await client.query('DELETE FROM posts WHERE id = $1', [postId]);
      });

      // Invalidate cache
      await invalidateCache(`post:${postId}:*`);
      await invalidateCache('feed:*');
    } catch (error) {
      throw error;
    }
  }

  async updatePostScore(postId: string): Promise<number> {
    try {
      const post = await this.getPostById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const score = calculatePostScore(post.upvotes, post.downvotes, post.created_at);

      const result = await query(
        `UPDATE posts SET score = $1 WHERE id = $2 RETURNING score`,
        [score, postId]
      );

      return result.rows[0].score;
    } catch (error) {
      throw error;
    }
  }

  async getPostsByKeyword(
    keyword: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const searchTerm = `%${keyword}%`;

      const totalResult = await query(
        `SELECT COUNT(*) FROM posts
         WHERE title ILIKE $1 OR content ILIKE $1`,
        [searchTerm]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT * FROM posts
         WHERE title ILIKE $1 OR content ILIKE $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      );

      return {
        posts: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async getTrendingPosts(
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        `SELECT COUNT(*) FROM posts
         WHERE created_at > NOW() - INTERVAL '7 days'`
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT 
          posts.*,
          users.username AS author_username,
          users.id AS author_user_id,
          communities.name AS community_name,
          communities.id AS community_id_ref,
          (posts.score / POWER(EXTRACT(EPOCH FROM (NOW() - posts.created_at))/3600 + 2, 1.5)) AS rank
         FROM posts
         JOIN users ON posts.author_id = users.id
         JOIN communities ON posts.community_id = communities.id
         WHERE posts.created_at > NOW() - INTERVAL '7 days'
         ORDER BY rank DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const posts = result.rows.map(post => ({
        ...post,
        author: {
          id: post.author_user_id,
          username: post.author_username
        },
        community: {
          id: post.community_id_ref,
          name: post.community_name
        }
      }));

      return {
        posts,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const postService = new PostService();
