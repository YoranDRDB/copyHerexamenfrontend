-- DropIndex
DROP INDEX `idx_user_username` ON `users`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_email_key` TO `idx_user_email_unique`;
