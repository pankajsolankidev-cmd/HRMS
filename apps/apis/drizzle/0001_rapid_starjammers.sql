CREATE TYPE "public"."week_day_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"name" varchar(255) NOT NULL,
	"working_start_time" time NOT NULL,
	"working_end_time" time NOT NULL,
	"week_off" "week_day_enum"[] NOT NULL
);
