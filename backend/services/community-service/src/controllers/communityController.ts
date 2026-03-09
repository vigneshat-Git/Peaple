import { Request, Response } from 'express';
import pool from '../../../shared/database/db';

export const createCommunity = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const user = (req as any).user;
  try {
    const id = generateId();
    const result = await pool.query(
      'INSERT INTO communities (id, name, description, created_by, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
      [id, name, description, user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listCommunities = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM communities');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCommunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM communities WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const membershipId = generateId();
    await pool.query(
      'INSERT INTO community_members (id, user_id, community_id) VALUES ($1,$2,$3)',
      [membershipId, user.userId, id]
    );
    res.json({ message: 'Joined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
