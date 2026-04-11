import { query } from '../../config/database.js';
import { User, JWTPayload } from '../../types/index.js';
import { hashPassword, verifyPassword, generateId } from '../../utils/helpers.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

export class AuthService {
  async register(username: string, email: string, password: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email or username');
      }

      const hashedPassword = await hashPassword(password);
      const userId = generateId();

      const result = await query(
        `INSERT INTO users (id, username, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, username, email, hashedPassword]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{
    user: User;
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];
      const isValidPassword = await verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      const payload: JWTPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
      };

      const access_token = generateAccessToken(payload);
      const refresh_token = generateRefreshToken(payload);

      return {
        user,
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      const newPayload: JWTPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
      };

      const access_token = generateAccessToken(newPayload);
      const new_refresh_token = generateRefreshToken(newPayload);

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<User> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      // Don't return password hash
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const allowedFields = ['username', 'profile_image', 'bio'];
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const result = await query(
        `UPDATE users
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async authenticateWithGoogle(googleToken: string): Promise<{
    user: User;
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const { env } = await import('../../config/env.js');
      
      if (!env.GOOGLE_CLIENT_ID) {
        throw new Error('Google OAuth not configured');
      }

      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      const { email, name, picture } = payload;
      const username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];

      // Check if user exists
      let user = await this.getUserByEmail(email);

      if (!user) {
        // Create new user
        user = await this.createGoogleUser(username, email, picture);
      }

      const jwtPayload: JWTPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
      };

      const access_token = generateAccessToken(jwtPayload);
      const refresh_token = generateRefreshToken(jwtPayload);

      return {
        user,
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }

  private async createGoogleUser(username: string, email: string, profileImage?: string): Promise<User> {
    try {
      // Ensure username is unique
      let finalUsername = username;
      let counter = 1;
      
      while (await this.getUserByUsername(finalUsername)) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      const result = await query(
        `INSERT INTO users (username, email, google_id, profile_image)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [finalUsername, email, email, profileImage] // Using email as google_id for simplicity
      );

      const user = result.rows[0];
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      delete user.password_hash;
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();
