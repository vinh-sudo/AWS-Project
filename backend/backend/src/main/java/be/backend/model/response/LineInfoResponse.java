package be.backend.model.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineInfoResponse {
    private Integer lineId;
    private String lineName;
    private Integer capacity;
    private String status;
    private LocalDateTime assignedSince;  // Khi nào được assign
}