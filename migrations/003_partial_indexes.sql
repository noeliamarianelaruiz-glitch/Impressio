-- Migration 003: Partial indexes for frequently-filtered active/incomplete records
-- Reduces index size by excluding irrelevant rows

-- Orders: active orders only (exclude cancelled/delivered)
CREATE INDEX IF NOT EXISTS idx_Order_active ON Order (companyId, status, createdAt DESC) WHERE status NOT IN ('CANCELLED', 'DELIVERED');

-- Orders: active orders by customer
CREATE INDEX IF NOT EXISTS idx_Order_active_customer ON Order (companyId, customerId, status, createdAt DESC) WHERE status != 'CANCELLED';

-- Production jobs: open jobs only
CREATE INDEX IF NOT EXISTS idx_ProductionJob_open ON ProductionJob (companyId, status, assignedToId, createdAt DESC) WHERE status NOT IN ('COMPLETED', 'DELAYED');

-- Inventory: low stock alerts
CREATE INDEX IF NOT EXISTS idx_Inventory_low_stock ON Inventory (companyId, productVariantId) WHERE quantity < minStock AND quantity > 0;

-- Notifications: unread only
CREATE INDEX IF NOT EXISTS idx_Notification_unread ON Notification (userId, type, createdAt DESC) WHERE read = false;

-- Invoices: overdue only
CREATE INDEX IF NOT EXISTS idx_Invoice_overdue ON Invoice (companyId, status, dueDate DESC) WHERE status = 'OVERDUE';

-- Quotes: active (non-expired, non-converted)
CREATE INDEX IF NOT EXISTS idx_Quote_active ON Quote (companyId, status, createdAt DESC) WHERE status NOT IN ('ACCEPTED', 'REJECTED', 'EXPIRED');

-- Purchase orders: open (non-received, non-cancelled)
CREATE INDEX IF NOT EXISTS idx_PurchaseOrder_open ON PurchaseOrder (companyId, status, expectedAt) WHERE status NOT IN ('RECEIVED', 'CANCELLED');