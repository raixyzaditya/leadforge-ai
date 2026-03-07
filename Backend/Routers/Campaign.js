import pool from "../DB/DB.js";
import express from "express";

const CampaignRouter = express.Router();

CampaignRouter.post("/create_campaign", async (req, res) => {

    const { created_by, organization_id, name, product_id } = req.body;
    try {
        const camp = await pool.query(`
            INSERT INTO campaigns
            (organization_id,product_id,name,created_by)
            VALUES($1,$2,$3,$4)
            RETURNING *
            `, [organization_id, product_id, name, created_by]);
        return res.status(200).json({
            message: "Campaign added successfully",
            campaign: camp.rows[0]
        });
    } catch (error) {
        console.log(error
        );
        return res.status(500).json({
            error: "Facing issue in creating your campaign",
        });
    }
})
CampaignRouter.get("/all_campaign/:org_id", async (req, res) => {
    const { org_id } = req.params;
    try {
        const cp = await pool.query(`
    SELECT c.*, p.name AS product_name
    FROM campaigns c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.organization_id = $1
    ORDER BY c.created_at DESC
`, [org_id]);
        const camps = cp.rows;
        return res.status(200).json({
            campaigns: camps
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Facing difficulty in getting the campaigns"
        });
    }
})
CampaignRouter.get("/campaign/:id", async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const c = await pool.query(
            `SELECT * FROM campaigns
             WHERE id = $1`, [id]
        );
        const campaign = c.rows[0];
        console.log(campaign)
        return res.status(200).json({
            camp: campaign
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Facing difficulty in getting the campaign"
        });
    }
})
export default CampaignRouter;