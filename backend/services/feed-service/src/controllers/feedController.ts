import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

// ranking algorithm
function score(post: any) {
  const up = post.upvotes || 0;
  const down = post.downvotes || 0;
  const hours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  return (up - down) / Math.pow(hours + 2, 1.5);
}

export const getFeed = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as media
      FROM posts p
      LEFT JOIN media m ON p.id = m.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    const posts = result.rows;
    posts.forEach((post: any) => {
      post.media = post.media.filter((m: any) => m.id !== null);
    });
    posts.sort((a: any, b: any) => score(b) - score(a));
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTrending = getFeed; // simple alias for now

export const getCommunityFeed = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as media
      FROM posts p
      LEFT JOIN media m ON p.id = m.post_id
      WHERE p.community_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [id]);
    const posts = result.rows;
    posts.forEach((post: any) => {
      post.media = post.media.filter((m: any) => m.id !== null);
    });
    posts.sort((a: any, b: any) => score(b) - score(a));
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
