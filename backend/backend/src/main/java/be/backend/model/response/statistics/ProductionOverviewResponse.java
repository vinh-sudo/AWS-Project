package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOverviewResponse {
    private long totalGood;
    private long totalReject;
    private long totalTarget;
    private long totalDowntimeMinutes;
    private double achievementRate;  // good / target
    private double rejectRate;       // reject / (good + reject)
    private String range;            // "TODAY", "WEEK", "MONTH"
}