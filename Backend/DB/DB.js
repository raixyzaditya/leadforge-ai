import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname,join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

import pkg from 'pg';
const {Pool} = pkg;
const pool = new Pool({
    host:'localhost',
    port:5432,
    database:process.env.DB_NAME,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD
})

export default pool;