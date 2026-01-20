ALTER TABLE "employees" ADD COLUMN "welcomeWithWhatsapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "welcomeWithGmail" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "welcomeWithSlack" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "welcomewith_whatsapp";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "welcomewith_gmail";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "welcomewith_slack";