CREATE TABLE audit_log_archive (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INT,
    details VARCHAR(2048),
    timestamp TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_archive_user_time
    ON audit_log_archive(user_id, timestamp DESC);

CREATE INDEX idx_archive_entity
    ON audit_log_archive(entity, entity_id, timestamp DESC);

CREATE INDEX idx_archive_action
    ON audit_log_archive(action_type, timestamp DESC);

CREATE INDEX idx_archive_timestamp
    ON audit_log_archive(timestamp DESC);
