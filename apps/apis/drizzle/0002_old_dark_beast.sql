ALTER TABLE "leave_requests" ADD COLUMN "from_hour" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "to_hour" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "total_hours" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "total_days" numeric NOT NULL;