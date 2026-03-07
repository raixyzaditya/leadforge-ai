import pool from "../DB/DB.js";
import express from "express";

const PlanRouter = express.Router();
PlanRouter.post('/register', async (req, res) => {
    const { type, org_id,user_id} = req.body;
    console.log("Incoming org_id:", org_id);

    const now = new Date();
    let endDate = new Date();
    try {
        const your_organization = await pool.query(
            `SELECT * FROM organizations
            WHERE id = $1`,[org_id]
        );
        const yo = your_organization.rows[0];
        console.log("Org row from DB in plan route:", yo);
        if (type === "Free") {
            if (yo.has_used_free_plan === true) {
                return res.status(400).json({ error: "You are done with your free trial. Now subscribe for more work!!" })
            }
            endDate.setMonth(now.getMonth() + 2);
            await pool.query(`
        UPDATE organizations
        SET plan_type = 'Free',subscription_status = 'Active',subscription_ends_at=$1,subscription_started_at=$2,has_used_free_plan=true
        WHERE id = $3
        `, [endDate,now ,org_id]);
        }else{
            endDate.setMonth(now.getMonth()+1);
            await pool.query(`
                UPDATE organizations
                SET plan_type=$1,
                subscription_status='Active',
                subscription_ends_at=$2,
                subscription_started_at=$3
                WHERE id=$4
                `,[type,endDate,now,org_id]);
        }
        const your_org= await pool.query(`
            SELECT * FROM organizations
            WHERE id = $1
            `,[org_id]);
        const your_user= await pool.query(`
            SELECT * FROM users
            WHERE id = $1
            `,[user_id]);
        const org = your_org.rows[0];
        const a = your_user.rows[0];

        return res.status(200).json({ message: "Your account created successfully",
            user: {
                id: a.id,
                full_name: a.full_name,
                email: a.email,
                org_id: org_id,
                joined: a.created_at,
                organization: {
                    name: org.name,
                    domain: org.domain,
                    industry: org.industry,
                    size: org.target_company_size,
                    plan_type: org.plan_type,
                    status: org.subscription_status,
                    end: org.subscription_ends_at,
                    
                }
            }
         });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Something went wrong" });
    }

})
export default PlanRouter;