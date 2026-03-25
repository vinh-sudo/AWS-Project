package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class OrderPlanItemsViewResponse {
    private Integer orderId;
    private String orderStatus;
    private boolean hasProductionFiles;
    private List<ItemView> items;

    @Data
    @Builder
    public static class ItemView {
        private Integer orderItemId;
        private Integer requiredQuantity;
        private Integer draftQuantity;
        private Integer confirmedQuantity;
        private Integer remainingQuantity;
        private String itemStatus;
        private boolean canConfirm;
        private String confirmBlockedReason;
        private List<StageView> stages;
    }

    @Data
    @Builder
    public static class StageView {
        private Integer planId;
        private String stage;
        private Integer lineId;
        private String lineName;
        private Integer plannedQuantity;
        private String decision;
        private OffsetDateTime startDate;
        private OffsetDateTime endDate;
        private Double estimatedHours;
    }
}
