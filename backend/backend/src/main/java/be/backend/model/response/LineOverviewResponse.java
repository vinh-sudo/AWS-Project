package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LineOverviewResponse {

    private Long lineId;
    private String lineName;

    private Double busyHours;
    private Double availableHours;

    private Integer availableMachines;

    private String status;
}
