CREATE TABLE "project_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"project_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_project_employee" ON "project_employees" USING btree ("project_id","employee_id");