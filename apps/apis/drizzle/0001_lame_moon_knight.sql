ALTER TABLE "payrolls" ADD COLUMN "deductions" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payrolls" ADD COLUMN "leave_deduction" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payrolls" ADD COLUMN "bonus" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "salary" ADD COLUMN "tax" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "salary" ADD COLUMN "pf" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "salary" ADD COLUMN "net_salary" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "payrolls" DROP COLUMN "total_deductions";