import pool from "./DB.js";
const createTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255),
            domain VARCHAR(255),
            industry VARCHAR(100),
            
            product_description TEXT,
            ideal_customer Text[],
            target_industry VARCHAR(100),
            target_company_size VARCHAR(50),
            target_geography VARCHAR(100),
            primary_goal VARCHAR(100),
            plan_type VARCHAR(50),
            subscription_status VARCHAR(50) DEFAULT 'Not active',
            
            subscription_started_at TIMESTAMP,
            subscription_ends_at TIMESTAMP,
            has_used_free_plan BOOLEAN DEFAULT false,
            stripe_customer_id VARCHAR(255),
            email_limit_per_day INTEGER DEFAULT 50,
            email_limit_per_month INTEGER DEFAULT 1000,
            daily_sent_count INTEGER DEFAULT 0,
            monthly_sent_count INTEGER DEFAULT 0,
            last_reset_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            full_name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            role VARCHAR(50) DEFAULT 'member',
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            email_provider VARCHAR(50),
            email_connected BOOLEAN DEFAULT false,
            email_connected_at TIMESTAMP,
            smtp_email VARCHAR(255),
            access_token TEXT,
            refresh_token TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS email_logs (
             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

             organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    

             email_type VARCHAR(50),
             sequence_step INTEGER,

             subject TEXT,
             body_snapshot TEXT,

             sent_at TIMESTAMP,
             delivered_at TIMESTAMP,
             bounced_at TIMESTAMP,
             bounce_reason TEXT,

             opened_at TIMESTAMP,
             open_count INTEGER DEFAULT 0,

             clicked_at TIMESTAMP,
             click_count INTEGER DEFAULT 0,

             replied_at TIMESTAMP,
             meeting_booked_at TIMESTAMP,

             status VARCHAR(50),

             provider_message_id VARCHAR(255),
             tracking_id VARCHAR(255),

             created_at TIMESTAMP DEFAULT NOW(),
             updated_at TIMESTAMP DEFAULT NOW()
            );
        CREATE INDEX IF NOT EXISTS idx_email_logs_org 
        ON email_logs(organization_id);
        CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    
    target_industry TEXT[],
    target_company_size VARCHAR(50),
    target_geography VARCHAR(100),
    
    
    primary_goal VARCHAR(100),
    
    
    is_active BOOLEAN DEFAULT true,
    campaigns_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
    CREATE TABLE IF NOT EXISTS campaigns(
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
product_id UUID REFERENCES products(id) ON DELETE CASCADE,
name VARCHAR(255) NOT NULL,
description TEXT,
status VARCHAR(20) DEFAULT 'Draft',
created_by UUID REFERENCES users(id) ON DELETE CASCADE,
launch_date TIMESTAMP,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prospects(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
 camp_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
 name VARCHAR(255),
 email VARCHAR(255) NOT NULL,
 company VARCHAR(255),
 website VARCHAR(255),
 linkedin VARCHAR(255),
 status VARCHAR(20) DEFAULT 'not_contacted',
 sequence_step INT DEFAULT 0,
 last_email_send_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);
DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_camp_email') THEN
                ALTER TABLE prospects ADD CONSTRAINT unique_camp_email UNIQUE (camp_id, email);
            END IF;
        END $$;

CREATE TABLE IF NOT EXISTS upload_jobs(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id UUID,
 organization_id UUID,
 total_rows INT,
 processed_rows INT DEFAULT 0,
 inserted INT DEFAULT 0,
 skipped INT DEFAULT 0,
 status VARCHAR(20) DEFAULT 'processing',
 created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS email_messages(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
 campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
 prospects_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
 sequence_step INT,
 subject TEXT,
 body TEXT,
 status VARCHAR(50) DEFAULT 'generated',
 send_at TIMESTAMP,
 opened_at TIMESTAMP,
 replied_at TIMESTAMP,
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
);

    `);

    console.log('Tables created successfully!');
    await pool.end();
};
createTables().catch(console.error)