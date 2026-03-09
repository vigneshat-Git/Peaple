import { Query } from 'pg';
import { query } from './database.js';

export async function runSeeds() {
  try {
    console.log('Running seeds...');

    // Create demo user
    await query(`
      INSERT INTO users (username, email, password_hash, bio)
      VALUES 
        ('demo_user', 'demo@example.com', '$2a$10$demo', 'Demo user account'),
        ('alice', 'alice@example.com', '$2a$10$demo', 'Alice'),
        ('bob', 'bob@example.com', '$2a$10$demo', 'Bob')
      ON CONFLICT DO NOTHING
    `);

    // Create demo communities
    const usersResult = await query('SELECT id FROM users LIMIT 3');
    const users = usersResult.rows;

    if (users.length > 0) {
      const userId = users[0].id;

      await query(`
        INSERT INTO communities (name, description, created_by)
        VALUES 
          ('General Discussion', 'General discussion about technology', $1),
          ('Web Development', 'Web development and frontend frameworks', $1),
          ('Backend Engineering', 'Backend and infrastructure topics', $1)
        ON CONFLICT (name) DO NOTHING
      `, [userId]);

      console.log('Seeds completed');
    }
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
