package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DelayResponse {
    private Integer scheduleId;
    private String line;
    private String machine;
    private int expected;
    private int actual;
    private int delay;
    private String risk;
}
