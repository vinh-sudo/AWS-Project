package be.backend.model.request;

import lombok.Data;

@Data
public class LinePlanRequest {
    private Long lineId;           // SMT, DIP, ASM...
    private Integer plannedQty;    // Manager nhập
    private Integer orderItemId;   // Plan for which order item
}