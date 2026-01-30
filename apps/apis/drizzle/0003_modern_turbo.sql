ALTER TABLE "leave_requests" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "rejected_by" uuid;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_rejected_by_employees_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;