package be.backend.service.manager;

import be.backend.model.dto.LineCapacityDTO;
import be.backend.model.response.LineOccupancyResponse;
import be.backend.model.response.LineOverviewResponse;
import be.backend.repository.ProductionLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
@Service
@RequiredArgsConstructor
public class ManagerLineOverviewService {

    private final ProductionLineRepository repository;

    public List<LineOverviewResponse> getOverview() {

        List<LineCapacityDTO> lines =
                repository.getLineCapacity(OffsetDateTime.now());

        return lines.stream().map(dto -> {

            int totalMachines = dto.getTotalMachines().intValue();
            int busyMachines  = dto.getBusyMachines().intValue();

            double shiftHours = dto.getShiftHours();
            double efficiency = dto.getEfficiency();

            double busyHours = dto.getBusyHours();

            double maxHours =
                    totalMachines * shiftHours * efficiency;

            double availableHours =
                    Math.max(0, maxHours - busyHours);

            int availableMachines =
                    Math.max(0, totalMachines - busyMachines);

            String status;
            if (availableMachines <= 0 || availableHours <= 0) {
                status = "OVERLOAD";
            } else if (availableHours <= maxHours * 0.15) {
                status = "TIGHT";
            } else {
                status = "OK";
            }

            return LineOverviewResponse.builder()
                    .lineId(dto.getLineId())
                    .lineName(dto.getLineName())
                    .busyHours(busyHours)
                    .availableHours(availableHours)
                    .availableMachines(availableMachines)
                    .status(status)
                    .build();

        }).toList();
    }

    public List<LineOccupancyResponse> getOccupancy() {
        List<LineCapacityDTO> lines = repository.getLineCapacity(OffsetDateTime.now());

        return lines.stream()
                .sorted(Comparator.comparing(LineCapacityDTO::getLineId))
                .map(dto -> {
                    int totalMachines = dto.getTotalMachines().intValue();
                    int busyMachines = dto.getBusyMachines().intValue();
                    long activeScheduleCount = dto.getActiveScheduleCount() == null ? 0 : dto.getActiveScheduleCount();

                    boolean occupied = busyMachines > 0 || activeScheduleCount > 0;
                    double occupancyPercent = totalMachines <= 0
                            ? 0.0
                            : Math.round((busyMachines * 10000.0) / totalMachines) / 100.0;

                    String status;
                    if (totalMachines <= 0) {
                        status = "NO_MACHINE";
                    } else if (busyMachines >= totalMachines) {
                        status = "FULLY_OCCUPIED";
                    } else if (occupied) {
                        status = "PARTIALLY_OCCUPIED";
                    } else {
                        status = "AVAILABLE";
                    }

                    return LineOccupancyResponse.builder()
                            .lineId(dto.getLineId())
                            .lineName(dto.getLineName())
                            .activeScheduleCount(activeScheduleCount)
                            .totalMachines(totalMachines)
                            .busyMachines(busyMachines)
                            .occupancyPercent(occupancyPercent)
                            .occupied(occupied)
                            .status(status)
                            .build();
                })
                .toList();
    }
}
