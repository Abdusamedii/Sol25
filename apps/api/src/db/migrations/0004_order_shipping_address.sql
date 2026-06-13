ALTER TABLE "orders" ADD COLUMN "shipping_address_line1" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_city" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_postal_code" varchar(32) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_country" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'paid'::"public"."order_status";
