package be.backend.model.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProductionPlanRequest {

    private Integer orderId;
    private LocalDate startDate;
    private String note;
    private List<LinePlanRequest> lines;
}
