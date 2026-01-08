CREATE TABLE "salary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"employee_id" uuid NOT NULL,
	"basic_salary" numeric(12, 2) NOT NULL,
	"description" text,
	"appraisal_date" timestamp
);
--> statement-breakpoint
DROP TABLE "salary_structures" CASCADE;--> statement-breakpoint
ALTER TABLE "salary" ADD CONSTRAINT "salary_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_salary_employee" ON "salary" USING btree ("employee_id");