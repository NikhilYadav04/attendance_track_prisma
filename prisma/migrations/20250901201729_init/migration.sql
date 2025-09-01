/*
  Warnings:

  - Added the required column `subjectName` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendedLectures` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."attendance_records" ADD COLUMN     "subjectName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."subjects" ADD COLUMN     "attendedLectures" INTEGER NOT NULL;
