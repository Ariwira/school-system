CREATE TYPE "public"."department" AS ENUM('academic', 'administration', 'finance', 'it', 'hr', 'other');--> statement-breakpoint
CREATE TYPE "public"."fee_type" AS ENUM('registration', 'spp', 'building', 'uniform', 'book', 'activity', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."institute_type" AS ENUM('foundation', 'school');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer', 'virtual_account', 'qris', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'inactive', 'resigned');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('pending', 'active', 'graduated', 'transferred', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."transfer_method" AS ENUM('cash', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'foundation', 'school');--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"amount_paid" numeric(12, 2) NOT NULL,
	"receipt" text,
	"receipt_file" text,
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_datetime" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_type" "fee_type" NOT NULL,
	"year" smallint NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fees_type_year_unique" UNIQUE("fee_type","year")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" text,
	"avatar" text,
	"role" "user_role" DEFAULT 'school' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "institutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"image" text,
	"established_year" smallint,
	"type" "institute_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutes_name_unique" UNIQUE("name"),
	CONSTRAINT "institutes_phone_unique" UNIQUE("phone"),
	CONSTRAINT "institutes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "staffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"institute_id" uuid NOT NULL,
	"name" text NOT NULL,
	"nik" text,
	"staff_number" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"gender" "gender" NOT NULL,
	"dob" date NOT NULL,
	"pob" text,
	"department" "department" NOT NULL,
	"join_date" date,
	"status" "staff_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staffs_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staffs_nik_unique" UNIQUE("nik"),
	CONSTRAINT "staffs_staff_number_unique" UNIQUE("staff_number"),
	CONSTRAINT "staffs_phone_unique" UNIQUE("phone"),
	CONSTRAINT "staffs_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"name" text NOT NULL,
	"nik" text,
	"nisn" text NOT NULL,
	"student_number" text NOT NULL,
	"dob" date,
	"pob" text,
	"gender" "gender" NOT NULL,
	"phone" text,
	"email" text,
	"generation_year" smallint NOT NULL,
	"admission_date" date NOT NULL,
	"status" "student_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_nik_unique" UNIQUE("nik"),
	CONSTRAINT "students_nisn_unique" UNIQUE("nisn"),
	CONSTRAINT "students_student_number_unique" UNIQUE("student_number"),
	CONSTRAINT "students_phone_unique" UNIQUE("phone"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_from_id" uuid NOT NULL,
	"transfer_to_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"issuer_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid,
	"approver_id" uuid,
	"issued_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"transfer_method" "transfer_method" NOT NULL,
	"receipt" text,
	"receipt_file" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subapps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"image" text,
	"institute_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subapps_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_id_fees_id_fk" FOREIGN KEY ("fee_id") REFERENCES "public"."fees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_transfer_from_id_institutes_id_fk" FOREIGN KEY ("transfer_from_id") REFERENCES "public"."institutes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_transfer_to_id_institutes_id_fk" FOREIGN KEY ("transfer_to_id") REFERENCES "public"."institutes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_issuer_id_staffs_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_sender_id_staffs_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."staffs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_receiver_id_staffs_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."staffs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approver_id_staffs_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."staffs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subapps" ADD CONSTRAINT "subapps_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE set null ON UPDATE no action;