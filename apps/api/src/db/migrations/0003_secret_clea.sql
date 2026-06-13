CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'payment_failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"card_last4" varchar(4),
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING (
  CASE "status"
    WHEN 'placed' THEN 'paid'::"public"."order_status"
    WHEN 'pending_payment' THEN 'pending_payment'::"public"."order_status"
    WHEN 'paid' THEN 'paid'::"public"."order_status"
    WHEN 'payment_failed' THEN 'payment_failed'::"public"."order_status"
    WHEN 'cancelled' THEN 'cancelled'::"public"."order_status"
    ELSE 'paid'::"public"."order_status"
  END
);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_payment'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");
