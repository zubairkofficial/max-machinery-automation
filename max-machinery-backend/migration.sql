-- Add missing columns to scheduled_call table
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS lead_id VARCHAR(255);
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS from_number VARCHAR(255);
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS to_number VARCHAR(255);
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS override_agent_id VARCHAR(255);
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'pending';
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS last_attempt_time TIMESTAMP;
ALTER TABLE scheduled_call ADD COLUMN IF NOT EXISTS result JSONB;

-- Add foreign key constraint
ALTER TABLE scheduled_call 
  ADD CONSTRAINT fk_scheduled_call_lead 
  FOREIGN KEY (lead_id) 
  REFERENCES leads(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Add zohoPhoneNumber and zohoEmail columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "zohoPhoneNumber" VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "zohoEmail" VARCHAR(255); 