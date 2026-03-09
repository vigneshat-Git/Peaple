import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

// TODO: Upload to Cloudflare R2; we'll require credentials via env

export const createPost = async (req: Request, res: Response) => {
  const { title, content, communityId, mediaUrl } = req.body;
  const user = (req as any).user;
  try {
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO posts (id, title, content, author_id, community_id, media_url, score, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,NOW()) RETURNING *`,
      [id, title, content, user.userId, communityId, mediaUrl || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listPosts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM posts');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const result = await pool.query('DELETE FROM posts WHERE id=$1 AND author_id=$2 RETURNING *', [id, user.userId]);
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
