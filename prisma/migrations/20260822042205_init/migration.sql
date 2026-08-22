-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `profile_picture_url` VARCHAR(255) NULL,
    `bio` TEXT NULL,
    `preferred_currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `language_preference` VARCHAR(10) NOT NULL DEFAULT 'en',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verified_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_is_active_idx`(`is_active`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `preference_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `email_notifications_enabled` BOOLEAN NOT NULL DEFAULT true,
    `newsletter_subscribed` BOOLEAN NOT NULL DEFAULT false,
    `theme` VARCHAR(10) NOT NULL DEFAULT 'auto',
    `privacy_level` VARCHAR(20) NOT NULL DEFAULT 'private',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preferences_user_id_key`(`user_id`),
    PRIMARY KEY (`preference_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `trip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `trip_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `cover_image_url` VARCHAR(255) NULL,
    `total_budget` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `public_url_slug` VARCHAR(100) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `trips_public_url_slug_key`(`public_url_slug`),
    INDEX `trips_user_id_idx`(`user_id`),
    INDEX `trips_start_date_idx`(`start_date`),
    INDEX `trips_is_public_idx`(`is_public`),
    INDEX `trips_public_url_slug_idx`(`public_url_slug`),
    PRIMARY KEY (`trip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stops` (
    `stop_id` INTEGER NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER NOT NULL,
    `city_id` INTEGER NOT NULL,
    `stop_sequence` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `accommodation_budget` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stops_trip_id_idx`(`trip_id`),
    INDEX `stops_city_id_idx`(`city_id`),
    UNIQUE INDEX `stops_trip_id_stop_sequence_key`(`trip_id`, `stop_sequence`),
    PRIMARY KEY (`stop_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `city_id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_name` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `country_code` VARCHAR(2) NOT NULL,
    `cost_index` VARCHAR(10) NOT NULL DEFAULT 'Medium',
    `popularity_score` INTEGER NOT NULL DEFAULT 0,
    `image_url` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cities_country_code_idx`(`country_code`),
    INDEX `cities_cost_index_idx`(`cost_index`),
    INDEX `cities_popularity_score_idx`(`popularity_score`),
    UNIQUE INDEX `cities_city_name_country_code_key`(`city_name`, `country_code`),
    PRIMARY KEY (`city_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200) NULL,
    `icon_url` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `categories_category_name_key`(`category_name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_name` VARCHAR(150) NOT NULL,
    `city_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `description` TEXT NULL,
    `estimated_cost` DECIMAL(10, 2) NULL,
    `estimated_duration` INTEGER NULL,
    `rating` DECIMAL(3, 2) NULL,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `image_url` VARCHAR(255) NULL,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_city_id_idx`(`city_id`),
    INDEX `activities_category_id_idx`(`category_id`),
    INDEX `activities_is_popular_idx`(`is_popular`),
    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_activities` (
    `trip_activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER NOT NULL,
    `stop_id` INTEGER NOT NULL,
    `activity_id` INTEGER NOT NULL,
    `scheduled_date` DATE NOT NULL,
    `scheduled_start_time` VARCHAR(5) NULL,
    `scheduled_end_time` VARCHAR(5) NULL,
    `actual_cost` DECIMAL(10, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'planned',
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trip_activities_trip_id_idx`(`trip_id`),
    INDEX `trip_activities_stop_id_idx`(`stop_id`),
    INDEX `trip_activities_scheduled_date_idx`(`scheduled_date`),
    UNIQUE INDEX `trip_activities_trip_id_activity_id_scheduled_date_key`(`trip_id`, `activity_id`, `scheduled_date`),
    PRIMARY KEY (`trip_activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_budgets` (
    `budget_id` INTEGER NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER NOT NULL,
    `accommodation_budget` DECIMAL(12, 2) NULL,
    `activities_budget` DECIMAL(12, 2) NULL,
    `food_budget` DECIMAL(12, 2) NULL,
    `transportation_budget` DECIMAL(12, 2) NULL,
    `miscellaneous_budget` DECIMAL(12, 2) NULL,
    `total_budget` DECIMAL(12, 2) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trip_budgets_trip_id_key`(`trip_id`),
    PRIMARY KEY (`budget_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_shares` (
    `share_id` INTEGER NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER NOT NULL,
    `shared_by_user_id` INTEGER NOT NULL,
    `shared_with_user_id` INTEGER NULL,
    `share_type` VARCHAR(20) NOT NULL DEFAULT 'public',
    `password_hash` VARCHAR(255) NULL,
    `share_url_slug` VARCHAR(100) NOT NULL,
    `allow_copy` BOOLEAN NOT NULL DEFAULT true,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    UNIQUE INDEX `trip_shares_share_url_slug_key`(`share_url_slug`),
    INDEX `trip_shares_trip_id_idx`(`trip_id`),
    INDEX `trip_shares_share_url_slug_idx`(`share_url_slug`),
    PRIMARY KEY (`share_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stops` ADD CONSTRAINT `stops_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`trip_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stops` ADD CONSTRAINT `stops_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`city_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`city_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_activities` ADD CONSTRAINT `trip_activities_stop_id_fkey` FOREIGN KEY (`stop_id`) REFERENCES `stops`(`stop_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_activities` ADD CONSTRAINT `trip_activities_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`activity_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_budgets` ADD CONSTRAINT `trip_budgets_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`trip_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_shares` ADD CONSTRAINT `trip_shares_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`trip_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_shares` ADD CONSTRAINT `trip_shares_shared_by_user_id_fkey` FOREIGN KEY (`shared_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_shares` ADD CONSTRAINT `trip_shares_shared_with_user_id_fkey` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
