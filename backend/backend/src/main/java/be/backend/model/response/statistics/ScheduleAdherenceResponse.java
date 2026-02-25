package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleAdherenceResponse {
    private long totalSchedules;
    private long completedCount;
    private long runningCount;
    private long pausedCount;
    private double completionRate; // completed / total
}