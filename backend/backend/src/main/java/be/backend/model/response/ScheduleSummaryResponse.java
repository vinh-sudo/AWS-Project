package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Summary của 1 Production Schedule
 * Dùng trong LeaderDashboardResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSummaryResponse {
    private Integer scheduleId;
    private String orderInfo;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
