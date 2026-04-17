package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LineOccupancyResponse {

    private Long lineId;
    private String lineName;

    private Long activeScheduleCount;

    private Integer totalMachines;
    private Integer busyMachines;

    private Double occupancyPercent;
    private Boolean occupied;
    private String status;
}

