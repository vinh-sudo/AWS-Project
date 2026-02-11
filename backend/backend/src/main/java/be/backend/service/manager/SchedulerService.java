package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final ProductionScheduleRepository scheduleRepo;
    private final MachineRepository machineRepo;
    private final LineLeaderAssignmentRepository leaderRepo;
    private final IncidentLogRepository incidentRepo;

    // ============== VALIDATE ==============
    public ScheduleValidationResult validateCapacity(List<ProductionPlan> plans) {

        for (ProductionPlan plan : plans) {

            var start = plan.getPlannedStartDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));
            var end   = plan.getPlannedEndDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));

            // 1. Leader check
            if (leaderRepo.findActiveLeader(plan.getLine().getId().longValue(), start, end).isEmpty()) {
                return ScheduleValidationResult.fail(
                        "No active line leader for " + plan.getLine().getLineName());
            }

            // 2. Line incident
            if (incidentRepo.hasBlockingIncident(
                    plan.getLine().getId().longValue(), null, start, end)) {
                return ScheduleValidationResult.fail(
                        "Line " + plan.getLine().getLineName() + " has blocking incident");
            }

            List<Machine> machines =
                    machineRepo.findByLineIdAndStatus(plan.getLine().getId(), "ACTIVE");

            double totalHours = 0;

            for (Machine m : machines) {

                // 3. Machine incident
                if (incidentRepo.hasBlockingIncident(
                        plan.getLine().getId().longValue(),
                        m.getId().longValue(),
                        start, end)) continue;

                // 4. Busy
                if (scheduleRepo.existsOverlappingMachineForUpdate(
                        m.getId().longValue(), start, end)) continue;

                // 5. Capacity in hours
                double hours =
                        plan.getLine().getShiftHours()
                                * plan.getLine().getEfficiency().doubleValue();

                totalHours += hours;
            }

            if (totalHours < plan.getEstimatedHours()) {
                return ScheduleValidationResult.fail(
                        "Not enough machine hours on line " + plan.getLine().getLineName());
            }
        }
        return ScheduleValidationResult.success();
    }

    // ============== CREATE SCHEDULE ==============
    @Transactional
    public List<ProductionSchedule> createSchedules(ProductionPlan plan) {

        var start = plan.getPlannedStartDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));
        var end   = plan.getPlannedEndDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));

        double remaining = plan.getEstimatedHours();
        double shift = plan.getLine().getShiftHours().doubleValue();
        double eff   = plan.getLine().getEfficiency().doubleValue();

        List<Machine> machines =
                machineRepo.findByLineIdAndStatus(plan.getLine().getId(), "ACTIVE");

        List<ProductionSchedule> result = new ArrayList<>();

        for (Machine m : machines) {
            if (remaining <= 0) break;

            if (scheduleRepo.existsOverlappingMachineForUpdate(
                    m.getId().longValue(), start, end)) continue;

            double available = shift * eff;
            double assigned = Math.min(available, remaining);
            double realHours = assigned / eff;

            ProductionSchedule s = new ProductionSchedule();
            s.setOrder(plan.getOrder());
            s.setPlan(plan);
            s.setMachine(m);
            s.setStartTime(start);
            s.setEndTime(start.plusHours((long) Math.ceil(realHours)));
            s.setStatus("SCHEDULED");

            result.add(scheduleRepo.save(s));
            remaining -= assigned;
        }

        return result;
    }
    @Transactional
    public void pauseSchedule(Integer scheduleId, Account account) {

        ProductionSchedule schedule = scheduleRepo.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!schedule.getStatus().equals("RUNNING")) {
            throw new RuntimeException("Only RUNNING schedule can be paused");
        }

        // 1. Pause schedule
        schedule.setStatus("PAUSED");

        // 2. Pause machine
        Machine machine = schedule.getMachine();
        machine.setRuntimeStatus("PAUSED");
        machineRepo.save(machine);

        // 3. Log
        IncidentLog log = new IncidentLog();
        log.setSchedule(schedule);
        log.setIncidentType("PAUSE");
        log.setDescription("Paused by " + account.getUser().getLastName());
        log.setTimestamp(OffsetDateTime.now());
        incidentRepo.save(log);
    }
    @Transactional
    public void resumeSchedule(Integer scheduleId, Account account) {

        ProductionSchedule schedule = scheduleRepo.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!schedule.getStatus().equals("PAUSED")) {
            throw new RuntimeException("Only PAUSED schedule can be resumed");
        }

        // 1. Resume schedule
        schedule.setStatus("RUNNING");

        // 2. Resume machine
        Machine machine = schedule.getMachine();
        machine.setRuntimeStatus("RUNNING");
        machineRepo.save(machine);

        // 3. Log
        IncidentLog log = new IncidentLog();
        log.setSchedule(schedule);
        log.setIncidentType("RESUME");
        log.setDescription("Resumed by " + account.getUser().getLastName());
        log.setTimestamp(OffsetDateTime.now());
        incidentRepo.save(log);
    }

}
