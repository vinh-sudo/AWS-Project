package be.backend.service.manager;

import be.backend.entity.ProductionLine;
import be.backend.model.response.DelayResponse;
import be.backend.repository.ProductionScheduleRepository;
import be.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DelayService {

    private final ProductionScheduleRepository scheduleRepo;
    private final ReportRepository reportRepo;

    public List<DelayResponse> detect() {

        // 1. Load all schedules that are currently RUNNING
        var schedules = scheduleRepo.findRunning();

        // 2. Calculate delay per schedule (do not group by line)
        List<DelayResponse> result = new ArrayList<>();

        for (var s : schedules) {

            ProductionLine line = s.getPlan().getLine();

            double hours =
                    Duration.between(s.getStartTime(), OffsetDateTime.now())
                            .toMinutes() / 60.0;

            int expected = (int) (hours * line.getCapacity() * line.getEfficiency().doubleValue());

            Long actualRaw = reportRepo.sumProducedQuantityByScheduleId(s.getId());
            int actual = actualRaw == null ? 0 : actualRaw.intValue();

            int delay = expected - actual;

            if (delay <= 0) {
                continue;
            }

            result.add(DelayResponse.builder()
                    .scheduleId(s.getId())
                    .line(line.getLineName())
                    .machine(s.getMachine().getMachineName())
                    .expected(expected)
                    .actual(actual)
                    .delay(delay)
                    .risk(delay > 200 ? "HIGH" : "MEDIUM")
                    .build());
        }

        return result;
    }

    public List<DelayResponse> getTodayDelay() {
        return detect();
    }
}
