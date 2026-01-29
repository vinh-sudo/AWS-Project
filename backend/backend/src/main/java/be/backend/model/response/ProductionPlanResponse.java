package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ProductionPlanResponse {

    private Long planId;
    private String lineName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Double estimatedHours;
    private String status;
}
