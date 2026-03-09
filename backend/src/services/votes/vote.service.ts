import { query, transaction } from '../../config/database.js';
import { Vote } from '../../types/index.js';
import { generateId } from '../../utils/helpers.js';
import { postService } from '../posts/post.service.js';
import { invalidateCache } from '../../config/redis.js';

export class VoteService {
  async voteOnPost(
    userId: string,
    postId: string,
    voteType: 'upvote' | 'downvote'
  ): Promise<Vote> {
    try {
      return await transaction(async (client) => {
        // Check if user already voted
        const existingVote = await client.query(
          `SELECT * FROM votes WHERE user_id = $1 AND post_id = $2`,
          [userId, postId]
        );

        let vote: Vote;

        if (existingVote.rows.length > 0) {
          const existing = existingVote.rows[0];

          // If same vote type, remove it
          if (existing.vote_type === voteType) {
            await client.query(
              `DELETE FROM votes WHERE id = $1`,
              [existing.id]
            );

            // Update post votes
            if (voteType === 'upvote') {
              await client.query(
                `UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = $1`,
                [postId]
              );
            } else {
              await client.query(
                `UPDATE posts SET downvotes = GREATEST(0, downvotes - 1) WHERE id = $1`,
                [postId]
              );
            }

            return { ...existing, vote_type: 'removed' } as any;
          } else {
            // Change vote type
            await client.query(
              `UPDATE votes SET vote_type = $1 WHERE id = $2`,
              [voteType, existing.id]
            );

            // Update post votes
            if (existing.vote_type === 'upvote') {
              await client.query(
                `UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = $1`,
                [postId]
              );
            } else {
              await client.query(
                `UPDATE posts SET downvotes = GREATEST(0, downvotes - 1) WHERE id = $1`,
                [postId]
              );
            }

            if (voteType === 'upvote') {
              await client.query(
                `UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1`,
                [postId]
              );
            } else {
              await client.query(
                `UPDATE posts SET downvotes = downvotes + 1 WHERE id = $1`,
                [postId]
              );
            }

            vote = existing;
            vote.vote_type = voteType;
          }
        } else {
          // Create new vote
          const voteId = generateId();
          const result = await client.query(
            `INSERT INTO votes (id, user_id, post_id, vote_type)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [voteId, userId, postId, voteType]
          );

          vote = result.rows[0];

          // Update post votes
          if (voteType === 'upvote') {
            await client.query(
              `UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1`,
              [postId]
            );
          } else {
            await client.query(
              `UPDATE posts SET downvotes = downvotes + 1 WHERE id = $1`,
              [postId]
            );
          }
        }

        return vote;
      });
    } catch (error) {
      throw error;
    }
  }

  async voteOnComment(
    userId: string,
    commentId: string,
    voteType: 'upvote' | 'downvote'
  ): Promise<Vote> {
    try {
      return await transaction(async (client) => {
        // Check if user already voted
        const existingVote = await client.query(
          `SELECT * FROM votes WHERE user_id = $1 AND comment_id = $2`,
          [userId, commentId]
        );

        let vote: Vote;

        if (existingVote.rows.length > 0) {
          const existing = existingVote.rows[0];

          if (existing.vote_type === voteType) {
            await client.query(
              `DELETE FROM votes WHERE id = $1`,
              [existing.id]
            );

            if (voteType === 'upvote') {
              await client.query(
                `UPDATE comments SET score = GREATEST(0, score - 1) WHERE id = $1`,
                [commentId]
              );
            } else {
              await client.query(
                `UPDATE comments SET score = LEAST(0, score + 1) WHERE id = $1`,
                [commentId]
              );
            }

            return { ...existing, vote_type: 'removed' } as any;
          } else {
            await client.query(
              `UPDATE votes SET vote_type = $1 WHERE id = $2`,
              [voteType, existing.id]
            );

            if (existing.vote_type === 'upvote') {
              await client.query(
                `UPDATE comments SET score = GREATEST(0, score - 1) WHERE id = $1`,
                [commentId]
              );
            } else {
              await client.query(
                `UPDATE comments SET score = LEAST(0, score + 1) WHERE id = $1`,
                [commentId]
              );
            }

            if (voteType === 'upvote') {
              await client.query(
                `UPDATE comments SET score = score + 1 WHERE id = $1`,
                [commentId]
              );
            } else {
              await client.query(
                `UPDATE comments SET score = score - 1 WHERE id = $1`,
                [commentId]
              );
            }

            vote = existing;
            vote.vote_type = voteType;
          }
        } else {
          const voteId = generateId();
          const result = await client.query(
            `INSERT INTO votes (id, user_id, comment_id, vote_type)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [voteId, userId, commentId, voteType]
          );

          vote = result.rows[0];

          if (voteType === 'upvote') {
            await client.query(
              `UPDATE comments SET score = score + 1 WHERE id = $1`,
              [commentId]
            );
          } else {
            await client.query(
              `UPDATE comments SET score = score - 1 WHERE id = $1`,
              [commentId]
            );
          }
        }

        return vote;
      });
    } catch (error) {
      throw error;
    }
  }

  async removeVote(voteId: string): Promise<void> {
    try {
      const voteResult = await query(
        'SELECT * FROM votes WHERE id = $1',
        [voteId]
      );

      if (voteResult.rows.length === 0) {
        throw new Error('Vote not found');
      }

      const vote = voteResult.rows[0];

      await transaction(async (client) => {
        await client.query('DELETE FROM votes WHERE id = $1', [voteId]);

        if (vote.post_id) {
          if (vote.vote_type === 'upvote') {
            await client.query(
              `UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = $1`,
              [vote.post_id]
            );
          } else {
            await client.query(
              `UPDATE posts SET downvotes = GREATEST(0, downvotes - 1) WHERE id = $1`,
              [vote.post_id]
            );
          }
        } else if (vote.comment_id) {
          if (vote.vote_type === 'upvote') {
            await client.query(
              `UPDATE comments SET score = GREATEST(0, score - 1) WHERE id = $1`,
              [vote.comment_id]
            );
          } else {
            await client.query(
              `UPDATE comments SET score = LEAST(0, score + 1) WHERE id = $1`,
              [vote.comment_id]
            );
          }
        }
      });

      await invalidateCache('feed:*');
    } catch (error) {
      throw error;
    }
  }

  async getUserVoteOnPost(userId: string, postId: string): Promise<Vote | null> {
    try {
      const result = await query(
        'SELECT * FROM votes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getUserVoteOnComment(userId: string, commentId: string): Promise<Vote | null> {
    try {
      const result = await query(
        'SELECT * FROM votes WHERE user_id = $1 AND comment_id = $2',
        [userId, commentId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getPostScore(postId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
    try {
      const result = await query(
        'SELECT upvotes, downvotes, score FROM posts WHERE id = $1',
        [postId]
      );

      if (result.rows.length === 0) {
        throw new Error('Post not found');
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export const voteService = new VoteService();
