-- AlterTable
ALTER TABLE `inspections`
    ADD COLUMN `observacoes` TEXT NULL,
    ADD COLUMN `status` ENUM('pendente', 'confirmada', 'realizada', 'cancelada') NOT NULL DEFAULT 'pendente';
