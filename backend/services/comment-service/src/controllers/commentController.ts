import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

export const createComment = async (req: Request, res: Response) => {
  const { postId, parentCommentId, content } = req.body;
  const user = (req as any).user;
  try {
    const id = generateId();
    await pool.query(
      'INSERT INTO comments (id, post_id, author_id, parent_comment_id, content, created_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [id, postId, user.userId, parentCommentId || null, content]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCommentsForPost = async (req: Request, res: Response) => {
  const { id } = req.params; // post id
  try {
    const result = await pool.query('SELECT * FROM comments WHERE post_id=$1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const result = await pool.query('DELETE FROM comments WHERE id=$1 AND author_id=$2 RETURNING *', [id, user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
