import { query, transaction } from '../../config/database.js';
import { Community } from '../../types/index.js';
import { generateId, getPaginationParams } from '../../utils/helpers.js';

export class CommunityService {
  async createCommunity(
    name: string,
    description: string,
    createdBy: string,
    iconUrl?: string,
    bannerUrl?: string
  ): Promise<Community> {
    try {
      return await transaction(async (client) => {
        const id = generateId();

        // Create community
        const communityResult = await client.query(
          `INSERT INTO communities (id, name, description, icon_url, banner_url, created_by, member_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [id, name, description, iconUrl, bannerUrl, createdBy, 1]
        );

        // Add creator as member
        await client.query(
          `INSERT INTO community_members (user_id, community_id)
           VALUES ($1, $2)`,
          [createdBy, id]
        );

        return communityResult.rows[0];
      });
    } catch (error) {
      throw error;
    }
  }

  async getCommunityById(communityId: string): Promise<Community | null> {
    try {
      const result = await query(
        'SELECT * FROM communities WHERE id = $1',
        [communityId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getCommunityByName(name: string): Promise<Community | null> {
    try {
      const result = await query(
        'SELECT * FROM communities WHERE name = $1',
        [name]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getAllCommunities(page: number = 1, limit: number = 20) {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query('SELECT COUNT(*) FROM communities');
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT * FROM communities
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        communities: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async joinCommunity(userId: string, communityId: string): Promise<void> {
    try {
      // Check if already a member
      const existing = await query(
        `SELECT id FROM community_members
         WHERE user_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      if (existing.rows.length > 0) {
        throw new Error('Already a member of this community');
      }

      await transaction(async (client) => {
        // Add member
        await client.query(
          `INSERT INTO community_members (user_id, community_id)
           VALUES ($1, $2)`,
          [userId, communityId]
        );

        // Update member count
        await client.query(
          `UPDATE communities SET member_count = member_count + 1
           WHERE id = $1`,
          [communityId]
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // Remove member
        await client.query(
          `DELETE FROM community_members
           WHERE user_id = $1 AND community_id = $2`,
          [userId, communityId]
        );

        // Update member count
        await client.query(
          `UPDATE communities SET member_count = GREATEST(0, member_count - 1)
           WHERE id = $1`,
          [communityId]
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async isMember(userId: string, communityId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT id FROM community_members
         WHERE user_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async getUserCommunities(userId: string, page: number = 1, limit: number = 20) {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        `SELECT COUNT(*) FROM community_members
         WHERE user_id = $1`,
        [userId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT c.* FROM communities c
         JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = $1
         ORDER BY cm.joined_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        communities: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateCommunity(
    communityId: string,
    userId: string,
    updates: Partial<Community>
  ): Promise<Community> {
    try {
      // Verify ownership
      const community = await this.getCommunityById(communityId);
      if (!community || community.created_by !== userId) {
        throw new Error('Unauthorized');
      }

      const allowedFields = ['description', 'icon_url', 'banner_url'];
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
      updateValues.push(communityId);

      const result = await query(
        `UPDATE communities
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        updateValues
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getCommunityMembers(communityId: string, page: number = 1, limit: number = 20) {
    try {
      const { offset } = getPaginationParams(page, limit);

      const totalResult = await query(
        `SELECT COUNT(*) FROM community_members WHERE community_id = $1`,
        [communityId]
      );
      const total = parseInt(totalResult.rows[0].count, 10);

      const result = await query(
        `SELECT u.* FROM users u
         JOIN community_members cm ON u.id = cm.user_id
         WHERE cm.community_id = $1
         ORDER BY cm.joined_at DESC
         LIMIT $2 OFFSET $3`,
        [communityId, limit, offset]
      );

      return {
        members: result.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const communityService = new CommunityService();
