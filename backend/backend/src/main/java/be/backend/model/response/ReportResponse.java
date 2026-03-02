package be.backend.model.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class ReportResponse {
    private Integer reportId;
    private Integer lineId;
    private String lineName;
    private LocalDate workDate;
    private String shift;
    private Integer goodQuantity;
    private Integer rejectQuantity;
    private Integer targetQuantity;
    private String message;
}