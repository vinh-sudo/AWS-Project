package be.backend.model.dto.projection;

public interface IncidentStatsProjection {
    String getIncidentType();
    String getSeverity();
    Long getCount();
}