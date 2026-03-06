CREATE TYPE "public"."notification_type" AS ENUM('leave', 'expenses');--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" "notification_type" NOT NULL;