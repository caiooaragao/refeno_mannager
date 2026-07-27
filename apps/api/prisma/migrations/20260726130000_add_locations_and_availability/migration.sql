-- CreateEnum equivalent for MySQL: use ENUM columns directly

-- CreateTable
CREATE TABLE `availability_slots` (
    `id` VARCHAR(191) NOT NULL,
    `local` ENUM('cabanga', 'recife_marina') NOT NULL,
    `horario_inicio` DATETIME(3) NOT NULL,
    `horario_fim` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `availability_slots_local_horario_inicio_key`(`local`, `horario_inicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `inspections`
    ADD COLUMN `local` ENUM('cabanga', 'recife_marina') NOT NULL DEFAULT 'cabanga',
    ADD COLUMN `availability_slot_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `inspections_availability_slot_id_key` ON `inspections`(`availability_slot_id`);

-- AddForeignKey
ALTER TABLE `inspections`
    ADD CONSTRAINT `inspections_availability_slot_id_fkey`
    FOREIGN KEY (`availability_slot_id`) REFERENCES `availability_slots`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
