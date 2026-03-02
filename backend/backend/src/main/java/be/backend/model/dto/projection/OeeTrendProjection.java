package be.backend.model.dto.projection;

import java.time.LocalDate;

public interface OeeTrendProjection {
    LocalDate getWorkDate();
    Long getTotalGood();
    Long getTotalReject();
    Long getTotalTarget();
    Long getTotalDowntime();
    Integer getShiftHours();
}