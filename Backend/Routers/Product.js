import express from "express";
import pool from "../DB/DB.js";

const ProductRouter = express.Router();

ProductRouter.post("/add_product", async (req, res) => {
    const { org_id, name, description, target_industry, target_company_size, target_geography, primary_goal } = req.body;
    console.log(req.body);
    const ideal_customer_arr = Array.isArray(target_industry) ? target_industry : [];
    try {
        const result = await pool.query(`
            INSERT INTO products
            (organization_id,name,description,target_industry,target_company_size,target_geography,primary_goal)
            VALUES ($1, $2,$3,$4::text[],$5,$6,$7)
            RETURNING *
            `, [org_id, name, description, ideal_customer_arr, target_company_size, target_geography, primary_goal]);

        return res.status(200).json({
            message: "Product added successfully",
            product: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'We are facing some difficulty in addition of your product'
        });
    }
})

ProductRouter.get("/get_product/:org_id", async (req, res) => {
    const { org_id } = req.params;
    try {
        const org = await pool.query(`
            SELECT * FROM products
            WHERE organization_id=$1
            `, [org_id]);
        const prods = org.rows;
        return res.status(200).json({
            products: prods
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Not able to get your products"
        });
    }
})
ProductRouter.get("/get_single_product/:id", async (req, res) => {

    const { id } = req.params;
    console.log(id);
    try {
        const org = await pool.query(`
            SELECT * FROM products
            WHERE id=$1
            `, [id]);
        const prods = org.rows[0];
        console.log(prods)
        return res.status(200).json({
            products: prods
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Not able to get your product"
        });
    }
})

ProductRouter.put("/update_product/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, target_industry, target_company_size, target_geography, primary_goal } = req.body;
    const ideal_customer_arr = Array.isArray(target_industry) ? target_industry : [];
    try {
        await pool.query(`
            UPDATE products
            SET name = $1,description=$2,target_industry=$3::text[],target_company_size=$4,target_geography=$5,primary_goal=$6
            WHERE id=$7
            `, [name, description, ideal_customer_arr, target_company_size, target_geography, primary_goal, id]);
        return res.status(200).json({
            message: "Product updated successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Something went wrong"
        });
    }
})
ProductRouter.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
            `, [id]
        )
        if (result.rowCount == 0) {
            return res.status(404).json({ error: "Product not found" });
        }
        return res.status(200).json({
            message: "Product deleted successfully",
            name:result.name
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Something went wrong" });
    }
})
export default ProductRouter;