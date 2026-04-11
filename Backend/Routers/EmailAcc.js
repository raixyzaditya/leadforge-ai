import pool from "../DB/DB.js";
import express from "express";

import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("Resend API key loaded:", !!process.env.RESEND_API_KEY);
console.log("Key starts with:", process.env.RESEND_API_KEY?.slice(0, 6));
const EmailRouter = express.Router();
const RESEND_KEY = process.env.RESEND_API_KEY;

async function resendRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers:{
            "Authorization":`Bearer ${RESEND_KEY}`,
            "Content-Type":"application/json",
        },
    };
    if (body){
        options.body = JSON.stringify(body);
    }
    const res = await fetch(`https://api.resend.com${endpoint}`, options);
    return res.json();
}

EmailRouter.get("/get/:organizationId",async(req,res)=>{
    const {organizationId} = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM email_accounts
            WHERE org_id = $1
            ORDER BY created_at ASC
            `,[organizationId]
        );
        return res.json({accounts:result.rows});
    } catch (error) {
        console.log("error in fetching your domain :- ",error.message);
        return res.status(500).json({error:"Error in fetching your domain"});
    }
})

EmailRouter.post("/add",async(req,res)=>{
    const {from_name,from_email,organization_id} = req.body;
    if (!from_name || !from_email || !organization_id){
        return res.status(500).json({error:"All fields are required"});
    }
    const domain = from_email.split("@")[1];
    if (!domain){
        return res.status(500).json({error:"Invalid email address"});
    }
    try {
        const data = await resendRequest("/domains","POST",{name:domain});
        console.log("resend response ",data);
        if (data.statusCode || !data.id) {
            return res.status(400).json({
                error: data.message || "Failed to register domain on Resend"
            });
        }
        await pool.query(`
            INSERT INTO email_accounts
            (org_id,from_name,from_email,domain_name,resend_domain_id,dns_record)
            VALUES ($1,$2,$3,$4,$5,$6)
            `,[organization_id,from_name,from_email,domain,data.id,JSON.stringify(data.records)]);
        return res.status(200).json({
            success:true,
            dns_record:data.records,
            domain_id: data.id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to register domain" });
    }
})

EmailRouter.post("/verify/:domainID",async(req,res)=>{
    const {domainID} = req.params;
    const {organization_id} = req.body
    try {
        const data = await resendRequest(`/domains/${domainID}/verify`,"POST")
        console.log("Verify response: ", data);
        if (result.data?.status === "verified"){
            await pool.query(`
                UPDATE email_accounts
                SET is_verified = true
                WHERE resend_domain_id = $1 AND org_id = $2
                `,[domainID,organization_id]);
            return res.status(200).json({verified:true});

        }
        return res.json({
            verified: false,
            message: "DNS not detected yet. Can take up to 48 hours."
        });
    } catch (error) {
        return res.status(500).json({ error: "Verification failed" });
    }
})
EmailRouter.patch("/set_default/:id",async(req,res)=>{
    const {id} = req.params;
    const {organization_id} = req.body;
    try {
        await pool.query(
            `UPDATE email_accounts
            SET is_default = false 
            WHERE org_id = $1`,[organization_id]
        );
        await pool.query(
            `UPDATE email_accounts
            SET is_default = true WHERE id = $1`,[id]
        );
        return res.status(200).json({success:true});
    } catch (err) {
        return res.status(500).json({ error: "Failed to set default" });
    }
})
EmailRouter.delete("/remove/:id",async(req,res)=>{
    const {id} = req.params;
    try {
        await pool.query(`DELETE FROM email_accounts WHERE id = $1`,[id]);
        return res.status(200).json({success:true});
    } catch (err) {
        return res.status(500).json({ error: "Failed to remove account" });
    }
})

export default EmailRouter;