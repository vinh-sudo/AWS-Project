package be.backend.model.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateProgressRequest {

    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;


    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
}