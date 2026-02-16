package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderResumeResponse {
    private Integer orderId;
    private String status;
    private int resumedSchedules;
}
