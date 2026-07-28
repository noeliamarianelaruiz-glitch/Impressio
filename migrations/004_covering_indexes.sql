-- Migration 004: Covering (INCLUDE) indexes for common SELECT paths
-- Avoids heap fetches — queries return all needed data from the index alone

-- Order list for dashboard
CREATE INDEX IF NOT EXISTS idx_Order_covering_dashboard ON Order (companyId, createdAt DESC) INCLUDE (status, totalAmount, customerId);

-- Order by customer for order history
CREATE INDEX IF NOT EXISTS idx_Order_covering_customer_history ON Order (companyId, customerId, createdAt DESC) INCLUDE (status, totalAmount, orderNumber);

-- Invoice aging report
CREATE INDEX IF NOT EXISTS idx_Invoice_covering_aging ON Invoice (companyId, status, dueDate DESC) INCLUDE (clientId, totalAmount, invoiceNumber);

-- Production job status board
CREATE INDEX IF NOT EXISTS idx_ProductionJob_covering_board ON ProductionJob (companyId, status, assignedToId) INCLUDE (orderId, quantity, variantId);

-- Payment list
CREATE INDEX IF NOT EXISTS idx_Payment_covering_list ON Payment (companyId, createdAt DESC) INCLUDE (amount, status, method, orderId);

-- Notification feed
CREATE INDEX IF NOT EXISTS idx_Notification_covering_feed ON Notification (userId, createdAt DESC) INCLUDE (title, type, read);

-- Uploaded file list
CREATE INDEX IF NOT EXISTS idx_UploadedFile_covering_list ON UploadedFile (companyId, createdAt DESC) INCLUDE (name, size, fileType, uploadedById);

-- Audit log list
CREATE INDEX IF NOT EXISTS idx_AuditLog_covering_list ON AuditLog (companyId, createdAt DESC) INCLUDE (action, entityType, entityId, actorId);