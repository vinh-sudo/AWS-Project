package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldTrendResponse {
    private List<YieldTrendItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldTrendItem {
        private LocalDate workDate;
        private double goodRate;
        private double rejectRate;
    }
}