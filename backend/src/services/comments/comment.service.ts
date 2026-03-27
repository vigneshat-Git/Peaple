import { query, transaction } from '../../config/database.js';
import { Comment } from '../../types/index.js';
import { generateId, getPaginationParams } from '../../utils/helpers.js';
import { invalidateCache } from '../../config/redis.js';

export class CommentService {
  async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> {
    try {
      const commentId = generateId();

      return await transaction(async (client) => {
        // Create comment
        const result = await client.query(
          `INSERT INTO comments (id, post_id, author_id, parent_comment_id, content)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [commentId, postId, authorId, parentCommentId || null, content]
        );

        // Increment comment count on post
        await client.query(
          `UPDATE posts SET comment_count = comment_count + 1
           WHERE id = $1`,
          [postId]
        );

        return result.rows[0];
      });
    } catch (error) {
      throw error;
    }
  }

  async getCommentById(commentId: string): Promise<Comment | null> {
    try {
      const result = await query(
        'SELECT * FROM comments WHERE id = $1',
        [commentId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        `SELECT COUNT(*) FROM comments
         WHERE post_id = $1`,
        [postId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT 
          c.*,
          u.id as user_id,
          u.username,
          u.profile_image as avatar
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.id
         WHERE c.post_id = $1
         ORDER BY c.created_at ASC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
      );

      // Transform to include author object
      const comments = result.rows.map(row => ({
        ...row,
        author: row.user_id ? {
          id: row.user_id,
          username: row.username,
          avatar: row.avatar
        } : null
      }));

      return {
        comments,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCommentReplies(
    parentCommentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        `SELECT COUNT(*) FROM comments
         WHERE parent_comment_id = $1`,
        [parentCommentId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT * FROM comments
         WHERE parent_comment_id = $1
         ORDER BY created_at ASC
         LIMIT $2 OFFSET $3`,
        [parentCommentId, limit, offset]
      );

      return {
        comments: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateComment(
    commentId: string,
    authorId: string,
    content: string
  ): Promise<Comment> {
    try {
      // Verify ownership
      const comment = await this.getCommentById(commentId);
      if (!comment || comment.author_id !== authorId) {
        throw new Error('Unauthorized');
      }

      const result = await query(
        `UPDATE comments
         SET content = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [content, commentId]
      );

      // Invalidate cache
      await invalidateCache(`post:${comment.post_id}:comments:*`);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteComment(commentId: string, authorId: string): Promise<void> {
    try {
      const comment = await this.getCommentById(commentId);
      if (!comment || comment.author_id !== authorId) {
        throw new Error('Unauthorized');
      }

      await transaction(async (client) => {
        // Delete replies
        await client.query(
          `DELETE FROM votes WHERE comment_id IN (
            SELECT id FROM comments WHERE parent_comment_id = $1
          )`,
          [commentId]
        );

        await client.query(
          `DELETE FROM comments WHERE parent_comment_id = $1`,
          [commentId]
        );

        // Delete votes on this comment
        await client.query(
          `DELETE FROM votes WHERE comment_id = $1`,
          [commentId]
        );

        // Delete comment
        await client.query(
          `DELETE FROM comments WHERE id = $1`,
          [commentId]
        );

        // Update post comment count
        await client.query(
          `UPDATE posts SET comment_count = GREATEST(0, comment_count - 1)
           WHERE id = $1`,
          [comment.post_id]
        );
      });

      // Invalidate cache
      await invalidateCache(`post:${comment.post_id}:comments:*`);
    } catch (error) {
      throw error;
    }
  }

  async getCommentThread(rootCommentId: string): Promise<Comment[]> {
    try {
      // Get the root comment and all its replies recursively
      const result = await query(
        `WITH RECURSIVE comment_tree AS (
          SELECT * FROM comments WHERE id = $1
          UNION ALL
          SELECT c.* FROM comments c
          JOIN comment_tree ct ON c.parent_comment_id = ct.id
        )
        SELECT * FROM comment_tree
        ORDER BY created_at ASC`,
        [rootCommentId]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getUserComments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        'SELECT COUNT(*) FROM comments WHERE author_id = $1',
        [userId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT * FROM comments
         WHERE author_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        comments: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const commentService = new CommentService();
