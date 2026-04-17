package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ProductionPlanResponse {

    private Integer planId;
    private Integer orderId;
    private Integer orderItemId;
    private String planName;
    private Integer lineId;
    private String lineName;

    private Integer plannedQuantity;

    private OffsetDateTime startDate;
    private OffsetDateTime endDate;

    private Double estimatedHours;

    private String decision;
    private String note;
}
