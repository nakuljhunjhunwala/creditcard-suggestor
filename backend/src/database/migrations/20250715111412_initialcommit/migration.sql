/*
  Warnings:

  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserTypeEnum" AS ENUM ('student', 'staff', 'guardian');

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropTable
DROP TABLE "RefreshToken";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user_types" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_codes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status_type" TEXT NOT NULL,
    "is_excused" BOOLEAN NOT NULL DEFAULT false,
    "affects_ada" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "school_number" TEXT,
    "abbreviation" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "home_phone" TEXT,
    "school_phone" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "staff_number" TEXT,
    "department" TEXT,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "student_number" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "grade_level" INTEGER,
    "dob" DATE,
    "gender" TEXT,
    "email" TEXT,
    "home_phone" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "primary_language" TEXT,
    "ethnicity" TEXT,
    "entry_date" DATE,
    "exit_date" DATE,
    "requires_guardian" BOOLEAN NOT NULL DEFAULT false,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "email" TEXT NOT NULL,
    "home_phone" TEXT,
    "work_phone" TEXT,
    "mobile_phone" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "student_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_emergency" BOOLEAN NOT NULL DEFAULT true,
    "is_pickup_allowed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "course_number" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "credit_hours" INTEGER,
    "credit_type" TEXT,
    "department" TEXT,
    "subject_area" TEXT,
    "description" TEXT,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "section_number" TEXT NOT NULL,
    "room" TEXT,
    "max_enrollment" INTEGER,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_staff" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "section_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "date_enrolled" DATE NOT NULL,
    "date_left" DATE,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "section_id" TEXT,
    "enrollment_id" TEXT,
    "attendance_code_id" TEXT,
    "attendance_date" DATE NOT NULL,
    "period_number" INTEGER,
    "status" TEXT,
    "attendance_code" TEXT,
    "is_excused" BOOLEAN NOT NULL DEFAULT false,
    "affects_ada" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "attendance_method" TEXT NOT NULL DEFAULT 'manual',
    "recorded_by_user_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_data" JSONB,
    "external_source_system" TEXT,
    "external_source_id" TEXT,
    "is_synced_to_sis" BOOLEAN NOT NULL DEFAULT false,
    "sync_error" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_type" "UserTypeEnum" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "profile_picture" TEXT,
    "app_settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT,
    "source_system" TEXT,
    "table_name" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_inserted" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "sync_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_configs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "school_id" TEXT NOT NULL,
    "source_system" TEXT,
    "api_config" JSONB,
    "field_mapping" JSONB,
    "sync_schedule" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "user_types"("name");

-- CreateIndex
CREATE INDEX "attendance_codes_school_id_idx" ON "attendance_codes"("school_id");

-- CreateIndex
CREATE INDEX "attendance_codes_status_type_idx" ON "attendance_codes"("status_type");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_codes_school_id_code_key" ON "attendance_codes"("school_id", "code");

-- CreateIndex
CREATE INDEX "schools_school_number_idx" ON "schools"("school_number");

-- CreateIndex
CREATE INDEX "schools_is_active_is_deleted_idx" ON "schools"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "schools_external_source_system_external_source_id_key" ON "schools"("external_source_system", "external_source_id");

-- CreateIndex
CREATE INDEX "staff_school_id_idx" ON "staff"("school_id");

-- CreateIndex
CREATE INDEX "staff_user_type_id_idx" ON "staff"("user_type_id");

-- CreateIndex
CREATE INDEX "staff_is_active_is_deleted_idx" ON "staff"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "staff_external_source_system_external_source_id_key" ON "staff"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_school_id_email_key" ON "staff"("school_id", "email");

-- CreateIndex
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

-- CreateIndex
CREATE INDEX "students_grade_level_idx" ON "students"("grade_level");

-- CreateIndex
CREATE INDEX "students_requires_guardian_idx" ON "students"("requires_guardian");

-- CreateIndex
CREATE INDEX "students_is_active_is_deleted_idx" ON "students"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "students_external_source_system_external_source_id_key" ON "students"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_student_number_key" ON "students"("school_id", "student_number");

-- CreateIndex
CREATE INDEX "guardians_school_id_idx" ON "guardians"("school_id");

-- CreateIndex
CREATE INDEX "guardians_user_type_id_idx" ON "guardians"("user_type_id");

-- CreateIndex
CREATE INDEX "guardians_is_active_is_deleted_idx" ON "guardians"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_external_source_system_external_source_id_key" ON "guardians"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_school_id_email_key" ON "guardians"("school_id", "email");

-- CreateIndex
CREATE INDEX "student_guardians_student_id_idx" ON "student_guardians"("student_id");

-- CreateIndex
CREATE INDEX "student_guardians_guardian_id_idx" ON "student_guardians"("guardian_id");

-- CreateIndex
CREATE INDEX "student_guardians_is_primary_idx" ON "student_guardians"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_student_id_guardian_id_key" ON "student_guardians"("student_id", "guardian_id");

-- CreateIndex
CREATE INDEX "terms_school_id_idx" ON "terms"("school_id");

-- CreateIndex
CREATE INDEX "terms_start_date_end_date_idx" ON "terms"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "terms_is_active_is_deleted_idx" ON "terms"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "terms_external_source_system_external_source_id_key" ON "terms"("external_source_system", "external_source_id");

-- CreateIndex
CREATE INDEX "courses_school_id_idx" ON "courses"("school_id");

-- CreateIndex
CREATE INDEX "courses_is_active_is_deleted_idx" ON "courses"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "courses_external_source_system_external_source_id_key" ON "courses"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_school_id_course_number_key" ON "courses"("school_id", "course_number");

-- CreateIndex
CREATE INDEX "sections_school_id_idx" ON "sections"("school_id");

-- CreateIndex
CREATE INDEX "sections_course_id_idx" ON "sections"("course_id");

-- CreateIndex
CREATE INDEX "sections_term_id_idx" ON "sections"("term_id");

-- CreateIndex
CREATE INDEX "sections_is_active_is_deleted_idx" ON "sections"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "sections_external_source_system_external_source_id_key" ON "sections"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "sections_school_id_course_id_term_id_section_number_key" ON "sections"("school_id", "course_id", "term_id", "section_number");

-- CreateIndex
CREATE INDEX "section_staff_section_id_idx" ON "section_staff"("section_id");

-- CreateIndex
CREATE INDEX "section_staff_staff_id_idx" ON "section_staff"("staff_id");

-- CreateIndex
CREATE INDEX "section_staff_role_idx" ON "section_staff"("role");

-- CreateIndex
CREATE INDEX "section_staff_is_active_idx" ON "section_staff"("is_active");

-- CreateIndex
CREATE INDEX "section_staff_start_date_end_date_idx" ON "section_staff"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "section_staff_section_id_staff_id_role_key" ON "section_staff"("section_id", "staff_id", "role");

-- CreateIndex
CREATE INDEX "enrollments_school_id_idx" ON "enrollments"("school_id");

-- CreateIndex
CREATE INDEX "enrollments_student_id_idx" ON "enrollments"("student_id");

-- CreateIndex
CREATE INDEX "enrollments_section_id_idx" ON "enrollments"("section_id");

-- CreateIndex
CREATE INDEX "enrollments_term_id_idx" ON "enrollments"("term_id");

-- CreateIndex
CREATE INDEX "enrollments_teacher_id_idx" ON "enrollments"("teacher_id");

-- CreateIndex
CREATE INDEX "enrollments_is_active_is_deleted_idx" ON "enrollments"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_external_source_system_external_source_id_key" ON "enrollments"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_section_id_term_id_key" ON "enrollments"("student_id", "section_id", "term_id");

-- CreateIndex
CREATE INDEX "attendance_school_id_idx" ON "attendance"("school_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_attendance_date_idx" ON "attendance"("student_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_section_id_idx" ON "attendance"("section_id");

-- CreateIndex
CREATE INDEX "attendance_attendance_date_idx" ON "attendance"("attendance_date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "attendance_attendance_code_id_idx" ON "attendance"("attendance_code_id");

-- CreateIndex
CREATE INDEX "attendance_is_synced_to_sis_idx" ON "attendance"("is_synced_to_sis");

-- CreateIndex
CREATE INDEX "attendance_recorded_by_user_id_idx" ON "attendance"("recorded_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_external_source_system_external_source_id_key" ON "attendance"("external_source_system", "external_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_student_id_section_id_attendance_date_period_num_key" ON "attendance"("student_id", "section_id", "attendance_date", "period_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_firebase_uid_idx" ON "users"("firebase_uid");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_user_type_idx" ON "users"("user_type");

-- CreateIndex
CREATE INDEX "users_entity_id_idx" ON "users"("entity_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "sync_jobs_school_id_idx" ON "sync_jobs"("school_id");

-- CreateIndex
CREATE INDEX "sync_jobs_source_system_idx" ON "sync_jobs"("source_system");

-- CreateIndex
CREATE INDEX "sync_jobs_table_name_idx" ON "sync_jobs"("table_name");

-- CreateIndex
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sync_configs_school_id_key" ON "sync_configs"("school_id");

-- CreateIndex
CREATE INDEX "sync_configs_school_id_idx" ON "sync_configs"("school_id");

-- CreateIndex
CREATE INDEX "sync_configs_source_system_idx" ON "sync_configs"("source_system");

-- CreateIndex
CREATE INDEX "sync_configs_is_enabled_idx" ON "sync_configs"("is_enabled");
