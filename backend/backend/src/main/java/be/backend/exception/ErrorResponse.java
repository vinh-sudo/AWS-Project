package be.backend.exception;

import java.time.OffsetDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse{
    private String code;
    private String message;
    private OffsetDateTime  timestamp;
    private Map<String,String> fieldErrors;
    
}