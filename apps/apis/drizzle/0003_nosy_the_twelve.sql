CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"title" varchar(255) NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"description" text
);
