ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_system_id_unique" UNIQUE("system_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "system_components" ADD CONSTRAINT "system_components_component_id_unique" UNIQUE("component_id");