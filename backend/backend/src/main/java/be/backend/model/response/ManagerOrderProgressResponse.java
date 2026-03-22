package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ManagerOrderProgressResponse {

    private Integer orderId;
    private String orderStatus;
    private BigDecimal orderCompletionPercentage;
    private boolean routeCompleted;

    private List<ItemProgressView> items;

    @Data
    @Builder
    public static class ItemProgressView {
        private Integer orderItemId;
        private String productName;
        private Integer requiredQuantity;

        private BigDecimal completionPercentage;
        private boolean routeCompleted;

        private List<StageProgressView> stages;
    }

    @Data
    @Builder
    public static class StageProgressView {
        private String stage; // SMT, DIP, ASSEMBLY, TESTING, PACKING
        private Integer lineId;
        private String lineName;

        private String scheduleStatus;
        private BigDecimal stageCompletionPercentage;

        private Integer effectiveTargetQuantity;
        private Integer totalGoodQuantity;
        private Integer totalRejectQuantity;

        private List<DailyReportView> dailyReports;
    }

    @Data
    @Builder
    public static class DailyReportView {
        private LocalDate workDate;
        private String shift;
        private Integer targetQuantity;
        private Integer goodQuantity;
        private Integer rejectQuantity;
        private Integer downtimeMinutes;
    }
}

