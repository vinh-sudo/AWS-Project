package be.backend.model.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ProgressResponse {
    private Integer scheduleId;
    private BigDecimal percentage;
    private String scheduleStatus;
    private String message;
}