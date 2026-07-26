-- CreateTable
CREATE TABLE `inspections` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `nome_embarcacao` VARCHAR(191) NOT NULL,
    `responsavel_inspecao` VARCHAR(191) NOT NULL,
    `horario_inicio` DATETIME(3) NOT NULL,
    `horario_fim` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
