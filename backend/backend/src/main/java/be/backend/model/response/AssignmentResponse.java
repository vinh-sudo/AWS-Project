package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class AssignmentResponse {
    private Long assignmentId;
    private Integer lineId;
    private String lineName;
    private Integer leaderId;         // employee_id
    private String leaderEmployeeCode;
    private String leaderUsername;
    private String status;            // ACTIVE / InACTIVE
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
}