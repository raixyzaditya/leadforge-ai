import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../DB/DB.js';
import jwt from 'jsonwebtoken';


const UserRouter = express.Router();

UserRouter.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const hash_pass = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (full_name,email,password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, full_name, email,created_at
            `,
            [name, email, hash_pass]
        );
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.status(200).json({
            message: "Successfully registered",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                org_id: null,
                joined: user.created_at,
                organization: null
            }
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
})

UserRouter.post('/login', async (req, res) => {
    const { email, pass } = req.body;
    console.log(email);
    console.log(pass);
    try {
        const existing = await pool.query(
            `SELECT id,email,password_hash,organization_id,full_name,created_at FROM users WHERE email = $1`,
            [email]
        );
        if (existing.rowCount === 0) {
            return res.status(404).json({ error: "User not exists!!" });
        }

        const user = existing.rows[0];
        const isMatch = await bcrypt.compare(pass, user.password_hash);
        if (!isMatch) {
            return res.status(500).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        const org = await pool.query(
            `SELECT name, domain, industry,target_company_size,plan_type,subscription_status,subscription_ends_at FROM organizations WHERE id = $1`, [user.organization_id]
        );
        const organization = org.rows[0];
        console.log(organization.subscription_ends_at)

        return res.status(200).json({
            message: "Valid credentials",
            user: {
                id: user.id,
                full_name: user.full_name,
                org_id: user.organization_id,
                email: user.email,
                joined: user.created_at,
                organization: {
                    name: organization.name,
                    domain: organization.domain,
                    size: organization.target_company_size,
                    industry: organization.industry,
                    plan_type: organization.plan_type,
                    status: organization.subscription_status,
                    end: organization.subscription_ends_at
                }


            },
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Something went wrong. Try again later" });
    }
})

export default UserRouter;