-- Financial records are no longer part of the product workflow.
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
