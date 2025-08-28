/*
  Warnings:

  - Added the required column `isPresent` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lectureNumber` to the `attendance_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `attendance_records` ADD COLUMN `isPresent` BOOLEAN NOT NULL,
    ADD COLUMN `lectureNumber` INTEGER NOT NULL;
