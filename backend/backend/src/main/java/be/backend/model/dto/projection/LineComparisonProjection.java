package be.backend.model.dto.projection;

public interface LineComparisonProjection {
    Integer getLineId();
    String getLineName();
    Long getTotalGood();
    Long getTotalReject();
    Long getTotalTarget();
    Long getTotalDowntime();
    Integer getShiftHours();
}