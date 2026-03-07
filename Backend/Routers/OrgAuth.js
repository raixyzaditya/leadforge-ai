import express from 'express';
import pool from '../DB/DB.js';

const OrgRouter = express.Router();
OrgRouter.post('/create', async (req, res) => {
    const { user_id, company_name, domain, industry, ideal_customer, product_description, target_size, target_geography, primary_goal } = req.body;
    console.log("BODY:", req.body);
    console.log("ideal_customer:", ideal_customer);
    console.log("is array:", Array.isArray(ideal_customer));
    const ideal_customer_arr = Array.isArray(ideal_customer) ? ideal_customer : []
    try {
        const org = await pool.query(
            `INSERT INTO organizations
             (name,domain,industry,product_description,ideal_customer,target_company_size,target_geography,primary_goal)
             VALUES ($1,$2,$3,$4,$5::text[],$6,$7,$8)
             RETURNING *`,
            [company_name, domain, industry, product_description, ideal_customer_arr, target_size, target_geography, primary_goal]
        );
        const your_org = org.rows[0];
        console.log("After insert:", your_org);
        await pool.query(
            `UPDATE users
            SET organization_id = $1,role='Admin',updated_at = NOW()
            WHERE id = $2`,
            [your_org.id, user_id]
        );
        const n = await pool.query(
            `SELECT * FROM users WHERE id = $1`, [user_id]
        );
        const a = n.rows[0];
        return res.status(200).json({
            message: "Organization completed successfully",
            user: {
                id: a.id,
                full_name: a.full_name,
                email: a.email,
                org_id: your_org.id,
                joined: a.created_at,
                organization: {
                    name: your_org.name,
                    domain: your_org.domain,
                    industry: your_org.industry,
                    size: your_org.target_company_size,
                    plan_type: null,
                    status: null,
                    end: null
                }
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Something went wrong'
        })
    }
})

export default OrgRouter;