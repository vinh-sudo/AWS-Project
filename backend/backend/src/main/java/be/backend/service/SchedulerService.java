package be.backend.service;

import be.backend.entity.Machine;
import be.backend.entity.ProductionPlan;
import be.backend.entity.ProductionSchedule;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.ProductionScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final ProductionScheduleRepository scheduleRepo;

    // Validate capacity + conflicts
    public ScheduleValidationResult validateCapacity(List<ProductionPlan> plans) {

        for (ProductionPlan plan : plans) {

            var start = plan.getPlannedStartDate()
                    .atStartOfDay()
                    .atOffset(ZoneOffset.of("+07:00"));

            var end = plan.getPlannedEndDate()
                    .atStartOfDay()
                    .atOffset(ZoneOffset.of("+07:00"));

            double requiredHours = plan.getEstimatedHours();
            double totalAvailable = 0;

            for (Machine m : plan.getLine().getMachines()) {

                boolean busy = scheduleRepo.existsOverlappingMachine(
                        m.getId().longValue(), start, end
                );

                if (!busy) {
                    double machineCapacity = m.getCapacity();
                    double shift = plan.getLine().getShiftHours();
                    double efficiency = plan.getLine().getEfficiency().doubleValue();

                    totalAvailable += machineCapacity * shift * efficiency;
                }
            }

            if (totalAvailable < requiredHours) {
                return ScheduleValidationResult.fail(
                        "Line " + plan.getLine().getLineName() +
                                " does not have enough capacity. Required " +
                                requiredHours + "h but only " + totalAvailable + "h available"
                );
            }
        }

        return ScheduleValidationResult.success();
    }

    // Auto split plan into machines
    public List<ProductionSchedule> createSchedules(ProductionPlan plan) {

        var start = plan.getPlannedStartDate()
                .atStartOfDay()
                .atOffset(ZoneOffset.of("+07:00"));

        double remaining = plan.getEstimatedHours();
        double shift = plan.getLine().getShiftHours();
        double efficiency = plan.getLine().getEfficiency().doubleValue();

        List<ProductionSchedule> result = new ArrayList<>();

        for (Machine m : plan.getLine().getMachines()) {

            if (remaining <= 0) break;

            boolean busy = scheduleRepo.existsOverlappingMachine(
                    m.getId().longValue(), start, start.plusDays(365)
            );

            if (busy) continue;

            double machineHours = m.getCapacity() * shift * efficiency;
            double assigned = Math.min(machineHours, remaining);

            ProductionSchedule s = new ProductionSchedule();
            s.setOrder(plan.getOrder());
            s.setPlan(plan);
            s.setMachine(m);
            s.setStartTime(start);
            s.setEndTime(start.plusHours((long) Math.ceil(assigned)));
            s.setStatus("SCHEDULED");

            result.add(scheduleRepo.save(s));

            remaining -= assigned;
        }

        return result;
    }
}
