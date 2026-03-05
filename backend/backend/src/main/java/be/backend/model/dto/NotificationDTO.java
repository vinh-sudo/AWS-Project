package be.backend.model.dto;

import java.time.OffsetDateTime;

public class NotificationDTO {

    private Integer id;
    private String title;
    private String message;
    private String level;
    private String status;
    private String sourceType;
    private Integer sourceId;
    private String url;
    private OffsetDateTime createdAt;

    public NotificationDTO() {
    }

    public NotificationDTO(Integer id, String title, String message, String level, String status,
                           String sourceType, Integer sourceId, String url,
                           OffsetDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.level = level;
        this.status = status;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.url = url;
        this.createdAt = createdAt;
    }

    public static NotificationDTO fromEntity(be.backend.entity.Notification n) {
        return new NotificationDTO(
            n.getId(),
            n.getTitle(),
            n.getMessage(),
            n.getLevel(),
            n.getStatus(),
            n.getSourceType(),
            n.getSourceId(),
            n.getUrl(),
            n.getCreatedAt()
        );
    }

    public Integer getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getLevel() { return level; }
    public String getStatus() { return status; }
    public String getSourceType() { return sourceType; }
    public Integer getSourceId() { return sourceId; }
    public String getUrl() { return url; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    public void setId(Integer id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setLevel(String level) { this.level = level; }
    public void setStatus(String status) { this.status = status; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public void setSourceId(Integer sourceId) { this.sourceId = sourceId; }
    public void setUrl(String url) { this.url = url; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
