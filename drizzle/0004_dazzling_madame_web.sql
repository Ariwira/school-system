ALTER TABLE "fees" DROP CONSTRAINT "fees_type_year_unique";--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "semester" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_type_year_semester_unique" UNIQUE("fee_type","year","semester");