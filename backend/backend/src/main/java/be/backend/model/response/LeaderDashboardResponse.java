package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import be.backend.enums.Role;
import be.backend.enums.EmployeeType;
import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard response cho Line Leader
 * Tổng hợp thông tin line đang quản lý
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderDashboardResponse {
    
    // Line info
    private Integer lineId;
    private String lineName;
    
    // Today's summary
    private Integer todayProducedQuantity;
    private Integer todayDowntimeMinutes;
    private BigDecimal todayEfficiency;
    
    // Active schedules
    private Integer activeScheduleCount;
    private List<ScheduleSummaryResponse> activeSchedules;
    
    // Recent incidents
    private Integer unresolvedIncidentCount;
    private List<IncidentSummaryResponse> recentIncidents;
}