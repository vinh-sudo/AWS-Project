package be.backend.service.manager;

import be.backend.entity.ProductionLine;
import be.backend.entity.Report;
import be.backend.model.response.OeeLineResponse;
import be.backend.repository.ProductionLineRepository;
import be.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OeeService {

    private final ReportRepository reportRepo;
    private final ProductionLineRepository lineRepo;

    public List<OeeLineResponse> calculate(LocalDate date) {

        // 1. Load toàn bộ line
        List<ProductionLine> lines = lineRepo.findAll();

        // 2. Lấy id các line
        List<Integer> lineIds = lines.stream()
                .map(ProductionLine::getId)
                .toList();

        // 3. Load toàn bộ report trong 1 query
        List<Report> allReports =
                reportRepo.findAllByLineIdsAndDate(lineIds, date);

        // 4. Group report theo line
        var reportMap =
                allReports.stream()
                        .collect(Collectors.groupingBy(
                                r -> r.getLine().getId()
                        ));

        // 5. Tính OEE
        List<OeeLineResponse> result = new ArrayList<>();

        for (ProductionLine line : lines) {

            List<Report> reports =
                    reportMap.getOrDefault(line.getId(), List.of());

            int good = 0;
            int reject = 0;
            int target = 0;
            int downtime = 0;

            for (Report r : reports) {
                good += r.getGoodQuantity();
                reject += r.getRejectQuantity();
                target += r.getTargetQuantity();
                downtime += r.getDowntimeMinutes() == null ? 0 : r.getDowntimeMinutes();
            }

            int shiftCount = countShiftBuckets(reports);
            double plannedPerShift = line.getShiftHours() == null ? 0 : line.getShiftHours() * 60.0;
            double planned = plannedPerShift * shiftCount;
            double operating = Math.max(0, planned - downtime);

            double availability = planned == 0 ? 0 : operating / planned;
            double performance = target == 0 ? 0 : (double) good / target;
            double quality = (good + reject) == 0 ? 0 : (double) good / (good + reject);

            result.add(OeeLineResponse.builder()
                    .line(line.getLineName())
                    .availability(round(availability))
                    .performance(round(performance))
                    .quality(round(quality))
                    .oee(round(availability * performance * quality))
                    .build());
        }

        return result;
    }

    public List<OeeLineResponse> getTodayOee() {
        return calculate(LocalDate.now());
    }

    private int countShiftBuckets(List<Report> reports) {
        if (reports.isEmpty()) {
            return 1;
        }

        Set<String> shifts = reports.stream()
                .map(Report::getShift)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        if (shifts.isEmpty()) {
            return reports.size();
        }
        return shifts.size();
    }

    private double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
