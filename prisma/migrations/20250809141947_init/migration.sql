/*
  Warnings:

  - You are about to drop the `attendancerecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userdata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `Subject_userDataId_fkey`;

-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `Subject_userId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `TimeTable_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userdata` DROP FOREIGN KEY `UserData_userId_fkey`;

-- DropTable
DROP TABLE `attendancerecord`;

-- DropTable
DROP TABLE `subject`;

-- DropTable
DROP TABLE `timetable`;

-- DropTable
DROP TABLE `user`;

-- DropTable
DROP TABLE `userdata`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `uniqueKey` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `users_uniqueKey_key`(`uniqueKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_tables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `timetable` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nickName` VARCHAR(191) NOT NULL,
    `collegeName` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `totalLectures` INTEGER NOT NULL,
    `targetPercentage` INTEGER NOT NULL DEFAULT 75,
    `userDataId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `markedAt` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `subjectId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `time_tables` ADD CONSTRAINT `time_tables_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_data` ADD CONSTRAINT `user_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_userDataId_fkey` FOREIGN KEY (`userDataId`) REFERENCES `user_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
