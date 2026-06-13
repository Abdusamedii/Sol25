CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_sku_trgm_idx" ON "products" USING gin ("sku" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_price_idx" ON "products" USING btree ("price");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_created_at_id_idx" ON "products" USING btree ("created_at","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");
