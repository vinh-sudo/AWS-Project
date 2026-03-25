package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemOverviewResponse {
    private long totalUsers;
    private long activeUsers;
    private long blockedUsers;
    private long totalEmployees;
    private long totalLines;
    private long activeLines;
    private long totalMachines;
    private long activeMachines;
}