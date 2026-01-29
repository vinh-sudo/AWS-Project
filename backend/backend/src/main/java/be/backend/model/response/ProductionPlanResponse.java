package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class ProductionPlanResponse {

    private Integer planId;
    private String lineName;

    private LocalDate startDate;
    private LocalDate endDate;

    private Double estimatedHours;
    private String status;
}
