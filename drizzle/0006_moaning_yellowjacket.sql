ALTER TABLE "user_preferences" ADD COLUMN "ai_daily_limit" integer;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "ai_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "last_active_at" timestamp DEFAULT now() NOT NULL;