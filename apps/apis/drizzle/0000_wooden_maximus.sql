CREATE TYPE "public"."payroll_month" AS ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');--> statement-breakpoint
CREATE TYPE "public"."leave_day_type" AS ENUM('full_day', 'first_half', 'second_half');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('sick', 'casual', 'marriage', 'wfh');--> statement-breakpoint
CREATE TABLE "components" (
	"name" varchar(100) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "components_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document_generation" (
	"employee_id" uuid NOT NULL,
	"generate_offer_letter" boolean DEFAULT false NOT NULL,
	"generate_appointment_letter" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"position" varchar(100) NOT NULL,
	"department_id" integer,
	"joining_date" date NOT NULL,
	"manager_id" uuid,
	"welcomewith_whatsapp" boolean DEFAULT false NOT NULL,
	"welcomewith_gmail" boolean DEFAULT false NOT NULL,
	"welcomewith_slack" boolean DEFAULT false NOT NULL,
	"system_id" uuid,
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "systems" (
	"name" varchar(100) NOT NULL,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "systems_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "system_components" (
	"system_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"employee_id" uuid NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"type" "leave_type" NOT NULL,
	"day_type" "leave_day_type" NOT NULL,
	"status" "leave_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"file" text
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"employee_id" uuid NOT NULL,
	"month" "payroll_month" NOT NULL,
	"year" integer NOT NULL,
	"processed_by" uuid NOT NULL,
	"total_deductions" numeric(12, 2) DEFAULT '0',
	"net_salary" numeric(12, 2) NOT NULL,
	"file" text,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "document_generation" ADD CONSTRAINT "document_generation_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_components" ADD CONSTRAINT "system_components_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_components" ADD CONSTRAINT "system_components_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary" ADD CONSTRAINT "salary_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_employee_month_year" ON "payrolls" USING btree ("employee_id","month","year");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_salary_employee" ON "salary" USING btree ("employee_id");