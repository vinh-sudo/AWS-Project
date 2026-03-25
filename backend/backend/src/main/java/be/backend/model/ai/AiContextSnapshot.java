package be.backend.model.ai;

import be.backend.model.response.DelayResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.model.response.statistics.ProductionOverviewResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiContextSnapshot {
    private LocalDateTime snapshotTime;
    private ProductionOverviewResponse productionOverview;
    private List<DelayResponse> delays;
    private List<OeeLineResponse> oeeByLine;
}
