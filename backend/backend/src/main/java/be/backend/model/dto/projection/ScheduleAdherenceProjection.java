package be.backend.model.dto.projection;

public interface ScheduleAdherenceProjection {
    Long getTotalSchedules();
    Long getCompletedCount();
    Long getRunningCount();
    Long getPausedCount();
}