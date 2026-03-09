import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

export const castVote = async (req: Request, res: Response) => {
  const { postId, type } = req.body; // type: 'upvote' | 'downvote'
  const user = (req as any).user;
  try {
    const id = generateId();
    await pool.query(
      'INSERT INTO votes (id, user_id, post_id, vote_type) VALUES ($1,$2,$3,$4)',
      [id, user.userId, postId, type]
    );

    // update post score
    const delta = type === 'upvote' ? 1 : -1;
    await pool.query('UPDATE posts SET score = score + $1 WHERE id=$2', [delta, postId]);

    res.status(201).json({ message: 'Voted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
