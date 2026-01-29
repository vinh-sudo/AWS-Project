package be.backend.model.request;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ProductionPlanningRequest {
    private OffsetDateTime startTime;
}