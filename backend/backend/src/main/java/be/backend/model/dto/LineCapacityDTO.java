package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LineCapacityDTO {

    private Long lineId;
    private String lineName;
    private Integer shiftHours;
    private Double efficiency;
    private Double busyHours;
    private Long totalMachines;
    private Long busyMachines;
}