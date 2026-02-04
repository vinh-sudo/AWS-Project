package be.backend.service.manager;

import be.backend.model.response.GanttItemResponse;
import be.backend.repository.ProductionScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GanttService {

    private final ProductionScheduleRepository scheduleRepo;


    public List<GanttItemResponse> getGantt(LocalDate date) {

        var start = date.atStartOfDay().atOffset(ZoneOffset.of("+07"));
        var end = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.of("+07"));

        return scheduleRepo.findInRange(start, end).stream()
                .map(s -> GanttItemResponse.builder()
                        .scheduleId(s.getId())
                        .line(s.getPlan().getLine().getLineName())
                        .machine(s.getMachine().getMachineName())
                        .orderId(s.getOrder().getId())
                        .start(s.getStartTime())
                        .end(s.getEndTime())
                        .status(s.getStatus())
                        .build())
                .toList();
    }
}
