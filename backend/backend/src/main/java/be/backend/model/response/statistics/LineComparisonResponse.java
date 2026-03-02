package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineComparisonResponse {
    private List<LineComparisonItem> lines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineComparisonItem {
        private int lineId;
        private String lineName;
        private long totalGood;
        private long totalReject;
        private long totalTarget;
        private double oee;
        private double yieldRate; // good / (good + reject)
    }
}