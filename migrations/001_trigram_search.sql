-- Migration: 001_trigram_search.sql
-- Add trigram indexes for fuzzy text search on key columns
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_trgm_Customer_email ON Customer USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Customer_name ON Customer USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Customer_phone ON Customer USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Supplier_name ON Supplier USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Supplier_email ON Supplier USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Product_name ON Product USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Product_description ON Product USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_Material_name ON Material USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_PrintingTechnique_name ON PrintingTechnique USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_quote_slug ON Quote USING gin (slug gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_order_number ON Order USING gin (orderNumber gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_invoice_number ON Invoice USING gin (invoiceNumber gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_AuditLog_action ON AuditLog USING gin (action gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_AuditLog_entityType ON AuditLog USING gin (entityType gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_uploaded_filename ON UploadedFile USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_uploaded_originalname ON UploadedFile USING gin (originalName gin_trgm_ops);
