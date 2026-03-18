package be.backend.model.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProductionPlanRequest {

    @NotNull(message = "orderId is required")
    private Integer orderId;

    @NotBlank(message = "planName is required")
    private String planName;

    @NotNull(message = "startDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    private String note;

    @NotEmpty(message = "lines must not be empty")
    @Valid
    private List<LinePlanRequest> lines;
}
