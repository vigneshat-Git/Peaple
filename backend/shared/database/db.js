import { Pool } from 'pg';
// Ensure DATABASE_URL is provided via environment variables
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
export default pool;
//# sourceMappingURL=db.js.map