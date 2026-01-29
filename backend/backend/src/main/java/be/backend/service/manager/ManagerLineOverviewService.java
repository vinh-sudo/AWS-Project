package be.backend.service.manager;

import be.backend.model.dto.LineCapacityDTO;
import be.backend.model.response.LineOverviewResponse;
import be.backend.repository.ProductionLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class ManagerLineOverviewService {

    private final ProductionLineRepository repository;

    public List<LineOverviewResponse> getOverview() {

        List<LineCapacityDTO> lines =
                repository.getLineCapacity(OffsetDateTime.now());

        return lines.stream().map(dto -> {

            double maxHours =
                    dto.getShiftHours() * dto.getEfficiency();

            double busyHours = dto.getBusyHours();
            double availableHours =
                    Math.max(0, maxHours - busyHours);

            int totalMachines =
                    dto.getTotalMachines().intValue();

            int busyMachines =
                    dto.getBusyMachines().intValue();

            int availableMachines =
                    Math.max(0, totalMachines - busyMachines);

            String status;
            if (availableHours <= 0 || availableMachines <= 0) {
                status = "OVERLOAD";
            } else if (availableHours <= 2) {
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
}