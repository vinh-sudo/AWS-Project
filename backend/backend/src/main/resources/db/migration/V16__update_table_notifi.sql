-- 1. đổi tên cột timestamp → created_at
ALTER TABLE notification
    RENAME COLUMN "timestamp" TO created_at;

-- 2. thêm các cột mới
ALTER TABLE notification
    ADD COLUMN title VARCHAR(200),
    ADD COLUMN level VARCHAR(20),
    ADD COLUMN source_type VARCHAR(30),
    ADD COLUMN source_id INTEGER,
    ADD COLUMN url TEXT;

-- 3. set default cho các bản ghi cũ
UPDATE notification
SET
    title = 'Notification',
    level = 'INFO',
    source_type = 'SYSTEM'
WHERE title IS NULL;

-- 4. ép NOT NULL cho các cột quan trọng
ALTER TABLE notification
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN level SET NOT NULL,
    ALTER COLUMN source_type SET NOT NULL;

-- 5. default values
ALTER TABLE notification
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN status SET DEFAULT 'UNREAD';
