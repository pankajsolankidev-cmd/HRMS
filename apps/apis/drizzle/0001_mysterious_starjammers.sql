CREATE TYPE "public"."expense_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"employee_id" uuid NOT NULL,
	"expense_type" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"file" varchar(255),
	"description" text,
	"status" "expense_status" DEFAULT 'DRAFT' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;