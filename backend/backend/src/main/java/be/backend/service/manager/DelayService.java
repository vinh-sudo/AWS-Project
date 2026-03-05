package be.backend.service.manager;

import be.backend.entity.ProductionLine;
import be.backend.entity.Report;
import be.backend.model.response.DelayResponse;
import be.backend.repository.ProductionScheduleRepository;
import be.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DelayService {

    private final ProductionScheduleRepository scheduleRepo;
    private final ReportRepository reportRepo;

    public List<DelayResponse> detect() {

        // 1. Load toàn bộ schedule đang RUNNING
        var schedules = scheduleRepo.findRunning();

        // 2. Lấy danh sách lineId
        var lineIds = schedules.stream()
                .map(s -> s.getPlan().getLine().getId())
                .distinct()
                .toList();

        // 3. Load TOÀN BỘ report của các line trong 1 query
        var allReports =
                reportRepo.findAllByLineIdsAndDate(lineIds, LocalDate.now());

        // 4. Group report theo line
        var reportMap =
                allReports.stream()
                        .collect(Collectors.groupingBy(
                                r -> r.getLine().getId()
                        ));

        // 5. Tính delay
        List<DelayResponse> result = new ArrayList<>();

        for (var s : schedules) {

            ProductionLine line = s.getPlan().getLine();

            List<Report> reports =
                    reportMap.getOrDefault(line.getId(), List.of());

            double hours =
                    Duration.between(s.getStartTime(), OffsetDateTime.now())
                            .toMinutes() / 60.0;

            int expected = (int) (hours * line.getCapacity() * line.getEfficiency().doubleValue());

            int actual = reports.stream()
                    .mapToInt(r -> r.getGoodQuantity() + r.getRejectQuantity())
                    .sum();

            int delay = expected - actual;

            if (delay <= 0) continue;

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
