import pool from "../DB/DB.js";
import express from "express";
import https from "https";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path:path.join(__dirname,"../.env")});


const agent = new https.Agent({rejectUnauthorized:false});
const sleep = (ms) => new Promise(r => setTimeout(r,ms));

function buildEmailHtml(prospect, baseUrl){
   return ` <div style=" font-family: sans-serif; font-size: 14px; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; "> ${prospect.email_body.replace(/\n/g, "<br/>")} </div> <br/> <hr style=" border: none; border-top: 1px solid #f0f0f0; margin: 20px 20px; "/> <p style=" font-size: 11px; color: #9ca3af; font-family: sans-serif; line-height: 1.6; padding: 0 20px 20px; "> This email was sent because your company was identified as a potential fit.<br/> Don't want these emails? href="${baseUrl}/prospects/unsubscribe/${prospect.id}" style="color: #9ca3af;" > Manage preferences </a> </p> <img src="${baseUrl}/prospects/track/open/${prospect.id}" width="1" height="1" style="display:none;border:0;" /> `;
}

const CampaignRouter = express.Router();

CampaignRouter.post("/launch/:campaignId",async(req,res)=>{
    const {campaignId} = req.params;
    const {organization_id} = req.body;
    try {
        const pr = await pool.query( // => getting the approved andd not contacted pros
            `SELECT * FROM prospects
            WHERE camp_id = $1
            AND email_status = 'approved'
            AND status = 'not_contacted'
            ORDER BY created_at ASC`,[campaignId]
        );
        const prospects = pr.rows;
        if(prospects.length === 0){
            return res.status(400).json({
                error:"No approved prospects found. Please approve emails on the review page first."
            });
        }
        await pool.query(
            `UPDATE campaigns SET status = 'Active' WHERE id = $1`,[campaignId]
        );
        res.json({
            success:true,
            total:prospects.length,
            message:`Sending to ${prospects.length} prospects`
        });

        let send = 0;
        let skipped = 0;
        let failed = 0;

        for (const prospect of prospects){
            try {
                const unsub = await pool.query(
                    `SELECT id FROM unsubscribes
                    WHERE org_id = $1
                    AND email = $2
                    AND (
                     scope = 'organization'
                     OR (scope = 'campaign' AND camp_id = $3)
                    )`,[organization_id,prospect.email,campaignId]
                );
                if (unsub.rows.length > 0){
                    console.log("Skipping unsubscribed : ",prospect.email);
                    await pool.query(
                        `UPDATE prospects SET status = 'unsubscribed' WHERE id = $1`,[prospect.id]
                    )
                    skipped++;
                    continue;
                }
                const html = buildEmailHtml(prospect,process.env.BASE_URL);
                const response = await fetch("https://api.resend.com/emails",{
                    method:"POST",
                    agent,
                    headers:{
                        "Authorization":`Bearer ${process.abort.env.RESEND_API_KEY}`,
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                        from: process.env.SENDING_EMAIL,
                        to: process.env.YOUR_TEST_EMAIL,
                        subject: `[TEST -> ${prospect.email}] ${prospect.email_subject}`,
                        html,
                    }),
                });
                const data = await response.json();
                console.log("Resend response:",data);
                if (data.id){
                    await pool.query(
                        `UPDATE prospects SET status='email_sent', last_email_send_at=NOW() WHERE id = $1`,[prospect.id]
                    );
                    send++;
                    console.log(`sent (${send}/${prospect.length}): `,prospect.email);
                }else{
                    failed++;
                    console.log(`Error for :- ${prospect.email} `,data);
                }

            } catch (error) {
                failed++;
                console.log(`Failed for ${prospect.email}`,error.message);
                console.log("full error ",error);
            }
            await sleep(2000);
        }
        console.log("Campaign complete");
        console.log(`Sent :- ${send}`);
        console.log(`skipped :- ${skipped}`);
        console.log(`failed :- ${failed}`);
    } catch (error) {
        console.error("Launch error :- ",error);
        if (!res.headersSent){
            res.status(500).json({error:"Launch failed"});
        }
    } 
})

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