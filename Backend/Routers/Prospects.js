import pool from "../DB/DB.js";
import express from "express";
import multer from "multer";
import fs from "fs";
import { spawn } from "child_process";
import csv from "csv-parser";


const upload = multer({
    dest: "uploads/"
});

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
        console.log("ORG:", organizationId);
        console.log("CAMP:", campaignId);
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
`, [organizationId, campaignId, name, email, company, website, linkedin]);

                        if (result.rowCount === 1) {
                            inserted++;
                            console.log("Inserted:", email);
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
                            skipped=$3
                        WHERE id = $4
                        `, [i + 1, inserted, skipped, jobID]);
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

export default ProspectsRouter;