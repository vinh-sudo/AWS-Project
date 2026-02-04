package be.backend.model.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@Builder
public class GanttItemResponse {
    private Integer scheduleId;
    private String line;
    private String machine;
    private Integer orderId;
    private OffsetDateTime start;
    private OffsetDateTime end;
    private String status;
}
