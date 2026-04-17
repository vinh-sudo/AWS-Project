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
public class OeeTrendResponse {
    private List<OeeTrendItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OeeTrendItem {
        private LocalDate workDate;
        private double availability;
        private double performance;
        private double quality;
        private double oee;
    }
}