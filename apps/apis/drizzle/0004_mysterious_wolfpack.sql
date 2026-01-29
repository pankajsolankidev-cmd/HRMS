ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_approved_by_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_rejected_by_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;