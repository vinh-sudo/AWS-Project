package be.backend.model.dto.projection;

public interface ProductionSummaryProjection {
    Long getTotalGood();
    Long getTotalReject();
    Long getTotalTarget();
    Long getTotalDowntime();
}