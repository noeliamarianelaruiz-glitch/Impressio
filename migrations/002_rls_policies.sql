-- Migration 002: Row Level Security policies for multi-tenant Supabase isolation
-- Run in Supabase SQL Editor or via migration tool

-- Enable RLS on all tenant-isolated tables
ALTER TABLE Company ENABLE ROW LEVEL SECURITY;
ALTER TABLE Branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE Customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE Product ENABLE ROW LEVEL SECURITY;
ALTER TABLE ProductVariant ENABLE ROW LEVEL SECURITY;
ALTER TABLE Material ENABLE ROW LEVEL SECURITY;
ALTER TABLE PrintingTechnique ENABLE ROW LEVEL SECURITY;
ALTER TABLE Quote ENABLE ROW LEVEL SECURITY;
ALTER TABLE QuoteItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE Order ENABLE ROW LEVEL SECURITY;
ALTER TABLE OrderItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE ProductionJob ENABLE ROW LEVEL SECURITY;
ALTER TABLE Inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE InventoryMovement ENABLE ROW LEVEL SECURITY;
ALTER TABLE Supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE PurchaseOrder ENABLE ROW LEVEL SECURITY;
ALTER TABLE PurchaseOrderItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE Invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE Shipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE Notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE UploadedFile ENABLE ROW LEVEL SECURITY;
ALTER TABLE AuditLog ENABLE ROW LEVEL SECURITY;
ALTER TABLE CompanyAddress ENABLE ROW LEVEL SECURITY;
ALTER TABLE CustomerAddress ENABLE ROW LEVEL SECURITY;
ALTER TABLE CompanySetting ENABLE ROW LEVEL SECURITY;

-- Company policies (owner can read/write all)
CREATE POLICY IF NOT EXISTS company_owner_read ON Company FOR SELECT USING (ownerId = auth.uid());

-- Per-table company-scoped policy template
-- Set LOCAL app.current_company_id at session start via Supabase Auth hook
CREATE POLICY company_isolation ON Company FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID OR ownerId = auth.uid());

-- User policies
CREATE POLICY user_own_company ON User FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID OR id = auth.uid());

-- Branch policies
CREATE POLICY branch_company_isolation ON Branch FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Customer policies
CREATE POLICY customer_company_isolation ON Customer FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Order policies
CREATE POLICY order_company_isolation ON Order FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Invoice policies
CREATE POLICY invoice_company_isolation ON Invoice FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Payment policies
CREATE POLICY payment_company_isolation ON Payment FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Production job policies
CREATE POLICY productionjob_company_isolation ON ProductionJob FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Audit log (read-only for members, full for owner)
CREATE POLICY auditlog_company_read ON AuditLog FOR SELECT USING (companyId = current_setting('app.current_company_id')::UUID);

-- Notification policies
CREATE POLICY notification_user_owned ON Notification FOR ALL USING (userId = auth.uid());

-- Uploaded file policies
CREATE POLICY uploadedfile_company_isolation ON UploadedFile FOR ALL USING (companyId = current_setting('app.current_company_id')::UUID);

-- Full database enable RLS helper
-- Run after creating all policies:
-- DO $\$\$ BEGIN
--   EXECUTE 'ALTER TABLE Company ENABLE ROW LEVEL SECURITY';
--   EXECUTE 'ALTER TABLE Branch ENABLE ROW LEVEL SECURITY';
--   -- ... repeat for each table
-- END $\$\$;