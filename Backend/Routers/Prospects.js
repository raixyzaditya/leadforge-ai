import pool from "../DB/DB.js";
import express from "express";
import multer from "multer";
import fs from "fs";
import { spawn } from "child_process";
import csv from "csv-parser";
import { Resend } from "resend";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path:path.join(__dirname,"../.env")});


const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({
    dest: "uploads/"
});


function scrapeWebsite(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            return resolve("");
        }
        const fullUrl = url.startsWith("https") ? url : `https://${url}`;
        const python = spawn("python3", ["Scrape_data.py", url]);
        let output = "";

        python.stdout.on("data", (chunk) => {
            output += chunk.toString();
        })
        python.stderr.on("data", () => { })
        python.on("close", () => {
            resolve(output.trim());
        })
    })

}

function getEmail(name, company, content, sender_name, sender_designation, product = {}) {
    return new Promise((resolve, reject) => {
        const python = spawn("python3", [
            "Generate_emails.py",]);
        let output = ""
        python.stdout.on("data", (chunk) => {
            output += chunk.toString();
        })
        python.stderr.on("data", () => { });
        python.on("close", () => {
            try {
                const parsed_output = JSON.parse(output.trim());
                resolve(parsed_output);
            } catch (error) {
                resolve({
                    subject: `Quick question about ${company}`,
                    body: `Hi ${name}, I wanted to reach out about ${product.name || "our product"}.s`
                })
            }

        })
        const inputData = JSON.stringify({
            name: name || "",
            company: company || "",
            content: (content || "").slice(0, 3000),
            product_name: product?.name || "",
            product_goal: product?.goal || "",
            product_description: product?.description || "",
            product_audience: product?.audience || "",
            sender_name: sender_name || "",
            sender_designation: sender_designation || ""
        });
        python.stdin.write(inputData);
        python.stdin.end();
    })
}


function getInfo(domain) {
    return new Promise((resolve, reject) => {
        console.log("Running Python for:", domain);

        const python = spawn("python3", ["Get_company_n_website.py", domain]);
        let output = "";
        let error = "";
        python.stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        python.stderr.on("data", (chunk) => {
            error += chunk.toString();
        });
        python.on("close", () => {
            console.log("Python finished for:", domain);
            if (error) {
                return reject(error)
            }
            const [web, company, linkedin] = output.trim().split(",");
            resolve({ web, company, linkedin });
        });
    });
}

const ProspectsRouter = express.Router();
ProspectsRouter.post("/upload_csv/add_prospects", upload.single('file'), async (req, res) => {
    console.log("Starting CSV processing...");
    try {
        const campaignId = req.body.campaign_id;
        const organizationId = req.body.organization_id;
        const sender_name = req.body.Name;
        const sender_designation = req.body.Designation;
        console.log("ORG:", organizationId);
        console.log("CAMP:", campaignId);
        const result = await pool.query(`
            SELECT product_id FROM campaigns 
            WHERE id = $1
            `, [campaignId]);
        const req_prod_id = result.rows[0]?.product_id;

        if (!campaignId || !organizationId) {
            return res.status(400).json({
                error: "campaign_id and organization_id are required"
            });
        }
        if (!req.file) {
            return res.status(404).json({ error: "CSV file is required" });
        }
        const job = await pool.query(
            `INSERT INTO upload_jobs (campaign_id,organization_id)
            VALUES ($1, $2) RETURNING *`, [campaignId, organizationId]
        );
        let product = null;
        try {
            const req_prod = await pool.query(`
            SELECT name, description, primary_goal, target_industry
            FROM products
            WHERE id = $1
            `, [req_prod_id]);
            product = req_prod.rows[0]
        } catch (error) {
            console.error("Failed to fetch product:", error);
        }



        const jobID = job.rows?.[0]?.id;
        console.log("jobID :- ", jobID);
        if (!jobID) {
            return res.status(500).json({
                error: "Failed to create upload job"
            });
        }

        res.json({ jobID });
        const rows = [];
        const errors = [];
        let headers = [];
        let inserted = 0;
        let skipped = 0;
        let emailsGenerated = 0;
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("headers", (h) => {
                headers = h.map(col => col.trim().toLowerCase());
                const requiredColumns = ["email"];
                const allowedColumns = ["name", "company", "email", "website", "linkedin"];
                const missing = requiredColumns.filter(
                    col => !headers.includes(col)
                );
                if (missing.length > 0) {
                    throw new Error("Missing Email column");
                }
                const invalid = headers.filter(
                    col => !allowedColumns.includes(col)
                );
                if (invalid.length > 0) {
                    throw new Error("Invalid column");
                }
            })
            .on("data", (data) => rows.push(data))

            .on("end", async () => {
                await pool.query(
                    `UPDATE upload_jobs
   SET total_rows=$1
   WHERE id=$2`,
                    [rows.length, jobID]
                );
                for (let i = 0; i < rows.length; i++) {
                    console.log(`Processing row ${i + 1}/${rows.length}`);
                    const row = rows[i];
                    const name = row.name;
                    const email = row.email?.trim();
                    let company = row.company || null;
                    let website = row.website || null;
                    let linkedin = row.linkedin || null;

                    if (!email) {
                        errors.push({
                            column: i + 1,
                            message: "Email is required"
                        });
                        skipped++;
                        continue;
                    }
                    if (!website || !company || !linkedin) {
                        const domain = email.split("@")[1];
                        const info = await getInfo(domain);
                        website = website || info.web;
                        company = company || info.company;
                        linkedin = linkedin || info.linkedin;
                    }


                    try {
                        console.log("Inserting:", email);
                        const result = await pool.query(`
INSERT INTO prospects
    (organization_id,camp_id,name,email,company,website,linkedin)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT(camp_id,email) DO NOTHING
    RETURNING id
`, [organizationId, campaignId, name, email, company, website, linkedin]);

                        if (result.rowCount === 1) {
                            inserted++;
                            const prospectId = result.rows[0].id;

                            console.log("Inserted:", email);
                            try {
                                console.log("Scraping website for :- ", email);
                                const scrapeData = await scrapeWebsite(website);
                                console.log("generating email for :- ", email);
                                const { subject, body } = await getEmail(
                                    name,
                                    company,
                                    scrapeData,
                                    sender_name,
                                    sender_designation,
                                    {
                                        name: product?.name || "",
                                        goal: product?.primary_goal || "",
                                        description: product?.description || "",
                                        audience: product?.target_industry || "",

                                    }
                                );
                                await pool.query(`
                                   UPDATE prospects
                                   SET email_subject=$1,email_body=$2,email_status='pending'
                                   WHERE id = $3 
                                    `, [subject, body, prospectId]);
                                emailsGenerated++;
                                console.log("email stored for :- ", email);
                            } catch (genErr) {
                                console.error("Email generation failed for:", email, genErr.message);
                            }
                        } else {
                            skipped++;
                            console.log("Duplicate skipped:", email);
                        }
                    } catch (error) {
                        skipped++;
                        errors.push({
                            row: i + 1,
                            message: error.message
                        });
                    }
                    await pool.query(`
                        UPDATE upload_jobs
                        SET processed_rows=$1,
                            inserted=$2,
                            skipped=$3,
                            email_generated = $4
                        WHERE id = $5
                        `, [i + 1, inserted, skipped, emailsGenerated, jobID]);
                }

                await pool.query(
                    `UPDATE upload_jobs
                    SET status='completed'
                    WHERE id = $1`, [jobID]
                );
                fs.unlinkSync(req.file.path);
                console.log("CSV processing finished");
                console.log("Inserted:", inserted);
                console.log("Skipped:", skipped);
                return;

            })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }

})

ProspectsRouter.get('/test_resend', async (req, res) => {
    try {
        const r = await resend.emails.send({
            from: process.env.SENDING_EMAIL,
            to: process.env.TEST_EMAIL,
            subject: "LeadForge — Resend is working!",
            html: `
                <div style="font-family:sans-serif;padding:32px;max-width:500px;">
                    <h2>Resend is connected</h2>
                    <p>Your LeadForge email sending is working correctly.</p>
                </div>
            `
        })
        console.log("email send successfully", r);
        return res.status(200).json({ message: "success", id: r.data?.id });
    } catch (error) {
        console.error("Resend error:", err);
        return res.status(500).json({ error: err.message });
    }
})
ProspectsRouter.get("/upload_status/:jobId", async (req, res) => {

    const { jobId } = req.params;

    const job = await pool.query(
        `SELECT * FROM upload_jobs WHERE id=$1`,
        [jobId]
    );

    res.json(job.rows[0]);
});

ProspectsRouter.get("/get_prospects/:camp_id", async (req, res) => {
    const { camp_id } = req.params;
    try {
        const pros = await pool.query(
            `SELECT * FROM prospects
            WHERE camp_id=$1`, [camp_id]
        );
        return res.status(200).json({
            prospects: pros.rows
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to load your prospects" });
    }
})

ProspectsRouter.get("/get_pros/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM prospects where id = $1`
            , [id])
        const prospect = result.rows[0];
        return res.status(200).json({
            prospect: prospect
        })
    } catch (error) {
        return res.status(500).json({
            error: "Not able to fetch this prospect"
        })
    }
})

ProspectsRouter.patch("/update_mail/:id", async (req, res) => {
    const { id } = req.params;
    const { email_body, email_status, email_subject } = req.body;
    try {
        await pool.query(`
            UPDATE prospects
            SET
              email_subject = COALESCE($1,email_subject),
              email_body = COALESCE($2,email_body),
              email_status = COALESCE($3, email_status)
            WHERE id = $4
            `, [email_subject, email_body, email_status, id]);
        return res.json({ success: true });
    } catch (error) {
        console.error("Update failed:", err);
        return res.status(500).json({ error: "Failed to update email" });
    }
})

ProspectsRouter.post("/add_prospects_manually", async (req, res) => {
    const { prospects, camp_id, organization_id } = req.body;
    if (!prospects?.length) {
        return res.status(500).json({ error: "No prospects provided" });
    }
    const campResult = await pool.query(
        `
        SELECT
         p.name AS product_name,
         p.description AS product_description,
         p.primary_goal AS product_goal,
         p.target_industry AS product_audience,
         u.full_name AS sender_name,
         u.designation AS sender_designation
         FROM campaigns c
         JOIN products p ON p.id = c.product_id
         JOIN users u ON u.organization_id = $2
         WHERE c.id = $1
         LIMIT 1
        `, [camp_id, organization_id]
    );
    const metadata = campResult.rows[0];
    res.json({ success: true, added: prospects.length });
    for (const prospect of prospects) {

        const { name, email } = prospect;
        let company = prospect.company || null;   // ← let not const
        let website = prospect.website || null;
        let linkedin = prospect.linkedin || null;
        if (!email) continue;
        if (!website || !company || !linkedin) {
            const domain = email.split("@")[1];
            const info = await getInfo(domain);
            website = website || info.web;
            company = company || info.company;
            linkedin = linkedin || info.linkedin;
        }
        try {
            const result = await pool.query(`
               INSERT INTO prospects
               (organization_id,camp_id,name,email,company,website,linkedin)
               VALUES ($1,$2,$3,$4,$5,$6,$7)
               ON CONFLICT (camp_id,email) DO NOTHING
               RETURNING id 
                `, [organization_id, camp_id, name, email, company, website, linkedin]);

            if (result.rowCount === 0) {
                console.log("Duplicate email skipped ", email);
                continue;
            }
            const prospectID = result.rows[0].id;
            console.log("Inserted email :- ", email);
            const web = website || `https://${email.split("@")[1]}`;
            console.log("Scraping web :- ", web);
            const scrapeData = await scrapeWebsite(web);
            console.log("Generating email :- ", email);
            const { subject, body } = await getEmail(
                name,
                company,
                scrapeData,
                metadata?.sender_name || "",
                metadata?.sender_designation || "",
                {
                    name: metadata?.product_name,
                    goal: metadata?.product_goal,
                    description: metadata?.product_description,
                    audience: metadata?.product_audience
                }
            );
            await pool.query(
                `UPDATE prospects
                SET email_subject = $1, email_body = $2, email_status='pending'
                WHERE id = $3
                `, [subject, body, prospectID]
            );
            console.log("Email ready for:", email);

        } catch (error) {
            console.error("Failed for:", email, error.message);
        }

    }
    console.log("Manual add complete for", prospects.length, "prospects");
})

ProspectsRouter.get("/unsubscribe/:prospectId", async (req, res) => {
    const { prospectId } = req.params;
    const { scope } = req.query;
    try {
        await pool.query(
            `UPDATE prospects SET status = 'opened'
             WHERE id = $1 AND status IN ('email_sent', 'not_contacted')`,
            [prospectId]
        );
        const result = await pool.query(
            `SELECT p.email, p.organization_id, p.camp_id,
                    o.name AS org_name
             FROM prospects p
             JOIN organizations o ON o.id = p.organization_id
             WHERE p.id = $1
            `, [prospectId]
        )

        if (!result.rows[0]) {
            return res.send("<h2>Already unsubscribed</h2>");
        }

        const { email, organization_id, camp_id, org_name } = result.rows[0];
        if (!scope) { return res.send(` <!DOCTYPE html> <html> <head> <title>Unsubscribe</title> <style> * { box-sizing:border-box; margin:0; padding:0; } body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9f9f9; padding: 24px; } .box { background: white; border-radius: 14px; border: 1px solid #e5e7eb; padding: 40px; max-width: 460px; width: 100%; text-align: center; } h2 { font-size: 20px; color: #111827; margin-bottom: 10px; } p { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 28px; } .option { display: block; width: 100%; padding: 14px 20px; margin-bottom: 10px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; font-size: 14px; font-family: sans-serif; cursor: pointer; text-align: left; text-decoration: none; color: #374151; transition: all 0.15s; } .option:hover { border-color: #111827; } .option.danger { color: #dc2626; border-color: #fecaca; } .option.danger:hover { background: #fef2f2; border-color: #dc2626; } .option-title { font-weight: 600; margin-bottom: 3px; } .option-desc { font-size: 12px; color: #9ca3af; } .option.danger .option-desc { color: #fca5a5; } </style> </head> <body> <div class="box"> <div style="font-size:36px;margin-bottom:16px;">✉️</div> <h2>Manage your preferences</h2> <p> You received an email from <strong>${org_name}</strong>.<br/> What would you like to do? </p> <a href="/prospects/unsubscribe/${prospectId}?scope=campaign" class="option"> <div class="option-title">Unsubscribe from this campaign only</div> <div class="option-desc"> You won't receive more emails about this topic. ${org_name} may still contact you about other products. </div> </a> <a href="/prospects/unsubscribe/${prospectId}?scope=organization" class="option danger"> <div class="option-title">Unsubscribe from all ${org_name} emails</div> <div class="option-desc"> You will never receive any email from ${org_name} again. </div> </a> </div> </body> </html> `); }
        if (scope === "campaign") {
            await pool.query(`
                INSERT INTO unsubscribes
                (org_id,camp_id,email,scope)
                VALUES($1,$2,$3,'campaign')
                ON CONFLICT DO NOTHING
                `, [organization_id, camp_id, email]);

            await pool.query(
                `
                UPDATE prospects SET status = 'unsubscribed' WHERE id = $1
                `, [prospectId]
            );
        } else if (scope === "organization") {
            await pool.query(`
                INSERT INTO unsubscribes
                (org_id,camp_id,email,scope)
                VALUES($1,NULL,$2,'organization')
                ON CONFLICT DO NOTHING
                `, [organization_id, email]);

            await pool.query(
                `
                UPDATE prospects SET status = 'unsubscribed' WHERE email = $1 AND organization_id = $2
                `, [email, organization_id]
            );

        }
        return res.send(` <!DOCTYPE html> <html> <head> <title>Unsubscribed</title> <style> body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9f9f9; } .box { text-align: center; padding: 48px; background: white; border-radius: 14px; border: 1px solid #e5e7eb; max-width: 420px; } h2 { color: #111827; margin-bottom: 10px; } p { color: #6b7280; font-size: 14px; line-height: 1.6; } </style> </head> <body> <div class="box"> <div style="font-size:40px;margin-bottom:16px;">✅</div> <h2>You've been unsubscribed</h2> <p> ${scope === "campaign" ? `You won't receive more emails about this campaign. You may still hear from ${org_name} about other products.` : `You won't receive any more emails from ${org_name}. This change is permanent.`} </p> </div> </body> </html> `);
    } catch (error) {
        console.error(error);
        res.send("<h2>Something went wrong. Please try again.</h2>");
    }
})

ProspectsRouter.get('/track/open/:prospectId', async (req, res) => {
    const { prospectId } = req.params;
    try {
        await pool.query(
            `UPDATE prospects SET status = 'opened' WHERE id = $1 AND status = 'email_sent'`, [prospectId]
        );
        console.log("Opened by: ", prospectId);
    } catch (error) {
        console.log("Tracking error :- ", err);
    }
    const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"); 
    res.writeHead(200, { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store", "Content-Length": pixel.length, }); 
    res.end(pixel);
})

export default ProspectsRouter;