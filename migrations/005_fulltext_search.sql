-- Migration 005: Full text search support with tsvector columns
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector columns for full-text search
ALTER TABLE Customer ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE Supplier ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE Product ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE Material ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE PrintingTechnique ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE Invoice ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE Quote ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE UploadedFile ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Create GIN indexes on tsvector columns
CREATE INDEX IF NOT EXISTS idx_fts_Customer_search ON Customer USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_Supplier_search ON Supplier USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_Product_search ON Product USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_Material_search ON Material USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_PrintingTechnique_search ON PrintingTechnique USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_Invoice_search ON Invoice USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_Quote_search ON Quote USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_fts_UploadedFile_search ON UploadedFile USING GIN (search_vector);

-- Auto-update triggers for tsvector
CREATE OR REPLACE FUNCTION update_customer_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B') || setweight(to_tsvector('spanish', coalesce(NEW.phone, '')), 'C') || setweight(to_tsvector('spanish', coalesce(NEW.notes, '')), 'D');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_customer_search_vector BEFORE INSERT OR UPDATE ON Customer FOR EACH ROW EXECUTE FUNCTION update_customer_search_vector();

CREATE OR REPLACE FUNCTION update_supplier_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B') || setweight(to_tsvector('spanish', coalesce(NEW.contactName, '')), 'C');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_supplier_search_vector BEFORE INSERT OR UPDATE ON Supplier FOR EACH ROW EXECUTE FUNCTION update_supplier_search_vector();

CREATE OR REPLACE FUNCTION update_product_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') || setweight(to_tsvector('spanish', coalesce(NEW.slug, '')), 'C');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_product_search_vector BEFORE INSERT OR UPDATE ON Product FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE OR REPLACE FUNCTION update_material_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_material_search_vector BEFORE INSERT OR UPDATE ON Material FOR EACH ROW EXECUTE FUNCTION update_material_search_vector();

CREATE OR REPLACE FUNCTION update_technique_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_technique_search_vector BEFORE INSERT OR UPDATE ON PrintingTechnique FOR EACH ROW EXECUTE FUNCTION update_technique_search_vector();

CREATE OR REPLACE FUNCTION update_invoice_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.invoiceNumber, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.notes, '')), 'D');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_invoice_search_vector BEFORE INSERT OR UPDATE ON Invoice FOR EACH ROW EXECUTE FUNCTION update_invoice_search_vector();

CREATE OR REPLACE FUNCTION update_quote_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.slug, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.notes, '')), 'D');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_quote_search_vector BEFORE INSERT OR UPDATE ON Quote FOR EACH ROW EXECUTE FUNCTION update_quote_search_vector();

CREATE OR REPLACE FUNCTION update_uploadedfile_search_vector() RETURNS TRIGGER AS $$ BEGIN
  NEW.search_vector := setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') || setweight(to_tsvector('spanish', coalesce(NEW.originalName, '')), 'B');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_uploadedfile_search_vector BEFORE INSERT OR UPDATE ON UploadedFile FOR EACH ROW EXECUTE FUNCTION update_uploadedfile_search_vector();

-- Full-text search query examples:
-- SELECT * FROM Customer WHERE search_vector @@ plainto_tsquery('spanish', 'search term');
-- SELECT * FROM Product WHERE search_vector @@ plainto_tsquery('spanish', 'search term') ORDER BY ts_rank(search_vector, plainto_tsquery('spanish', 'search term')) DESC;