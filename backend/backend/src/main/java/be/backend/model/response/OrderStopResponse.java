package be.backend.model.response;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderStopResponse {
    private Integer orderId;
    private String status;
    private int cancelledSchedules;
    private int stoppedSchedules;
}
