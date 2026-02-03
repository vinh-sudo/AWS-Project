package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OeeLineResponse {
    private String line;
    private double availability;
    private double performance;
    private double quality;
    private double oee;
}
