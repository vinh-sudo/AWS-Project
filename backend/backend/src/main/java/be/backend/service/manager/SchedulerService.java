package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final ProductionScheduleRepository scheduleRepo;
    private final MachineRepository machineRepo;
    private final LineLeaderAssignmentRepository leaderRepo;
    private final IncidentLogRepository incidentRepo;

    // ============== VALIDATE ==============
    public ScheduleValidationResult validateCapacity(List<ProductionPlan> plans) {

        Map<String, Double> reservedHoursByWindow = new HashMap<>();
        // Cache per (line, window) so multiple plans on same line+window don't re-hit DB
        Map<String, LineWindowCapacity> capacityCache = new HashMap<>();

        for (ProductionPlan plan : plans) {

            var start = plan.getPlannedStartDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));
            var end = plan.getPlannedEndDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));
            long windowDays = calculateWindowDays(start, end);

            Integer lineId = plan.getLine().getId();
            String windowKey = buildWindowKey(lineId, start, end);

            LineWindowCapacity lineCapacity = capacityCache.get(windowKey);
            if (lineCapacity == null) {
                // 1. Leader check
                if (leaderRepo.findActiveLeader(lineId.longValue(), start, end).isEmpty()) {
                    return ScheduleValidationResult.fail(
                            "No active line leader for " + plan.getLine().getLineName());
                }

                // 2. Line incident
                if (incidentRepo.hasBlockingIncident(lineId.longValue(), null, start, end)) {
                    return ScheduleValidationResult.fail(
                            "Line " + plan.getLine().getLineName() + " has blocking incident");
                }

                // 3. Active machines (case-insensitive status)
                List<Machine> machines = machineRepo.findActiveByLineId(lineId);

                double totalHoursInWindow = 0.0;

                for (Machine m : machines) {
                    // 4. Machine incident
                    if (incidentRepo.hasBlockingIncident(lineId.longValue(), m.getId().longValue(), start, end)) {
                        continue;
                    }

                    // 5. Busy
                    if (scheduleRepo.existsOverlappingMachineForUpdate(m.getId().longValue(), start, end)) {
                        continue;
                    }

                    double hoursPerDay = plan.getLine().getShiftHours()
                            * plan.getLine().getEfficiency().doubleValue();
                    totalHoursInWindow += hoursPerDay * windowDays;
                }

                lineCapacity = new LineWindowCapacity(totalHoursInWindow);
                capacityCache.put(windowKey, lineCapacity);
            }

            double alreadyReserved = reservedHoursByWindow.getOrDefault(windowKey, 0.0);
            double remainingHours = lineCapacity.totalHoursInWindow - alreadyReserved;

            if (remainingHours < plan.getEstimatedHours()) {
                return ScheduleValidationResult.fail(
                        "Not enough machine hours on line " + plan.getLine().getLineName()
                                + " (required " + Math.round(plan.getEstimatedHours() * 10.0) / 10.0
                                + "h, available " + Math.max(Math.round(remainingHours * 10.0) / 10.0, 0)
                                + "h)");
            }

            reservedHoursByWindow.put(windowKey, alreadyReserved + plan.getEstimatedHours());
        }
        return ScheduleValidationResult.success();
    }

    // ============== CREATE SCHEDULE ==============
    @Transactional
    public ScheduleCreationResult createSchedules(ProductionPlan plan) {

        var start = plan.getPlannedStartDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));
        var end = plan.getPlannedEndDate().atStartOfDay().atOffset(ZoneOffset.of("+07"));

        double remaining = plan.getEstimatedHours();
        double shift = plan.getLine().getShiftHours().doubleValue();
        double eff = plan.getLine().getEfficiency().doubleValue();

        // Use case-insensitive ACTIVE filter and reuse for all allocations
        List<Machine> machines = machineRepo.findActiveByLineId(plan.getLine().getId());

        // Build allocation plan first so we never persist partial schedules for a plan.
        List<MachineAllocation> allocations = new ArrayList<>();

        for (Machine m : machines) {
            if (remaining <= 0) {
                break;
            }

            if (scheduleRepo.existsOverlappingMachineForUpdate(m.getId().longValue(), start, end)) {
                continue;
            }

            double available = shift * eff;
            double assigned = Math.min(available, remaining);
            double realHours = assigned / eff;

            allocations.add(new MachineAllocation(m, realHours, assigned));
            remaining -= assigned;
        }

        if (remaining > 0) {
            return ScheduleCreationResult.fail(
                    "Could not allocate enough machine hours for plan " + plan.getId());
        }

        List<ProductionSchedule> result = new ArrayList<>();
        for (MachineAllocation allocation : allocations) {
            ProductionSchedule s = new ProductionSchedule();
            s.setOrder(plan.getOrder());
            s.setPlan(plan);
            s.setMachine(allocation.machine());
            s.setStartTime(start);
            s.setEndTime(start.plusHours((long) Math.ceil(allocation.realHours())));
            s.setStatus("SCHEDULED");

            result.add(scheduleRepo.save(s));
        }

        return ScheduleCreationResult.success(result);
    }

    private String buildWindowKey(Integer lineId, OffsetDateTime start, OffsetDateTime end) {
        return lineId + "|" + start.toString() + "|" + end.toString();
    }

    private long calculateWindowDays(OffsetDateTime start, OffsetDateTime end) {
        long days = ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate());
        return Math.max(days, 1);
    }

    private record LineWindowCapacity(double totalHoursInWindow) {}

    private record MachineAllocation(Machine machine, double realHours, double assignedHours) {
    }

    public record ScheduleCreationResult(boolean ok, String message, List<ProductionSchedule> schedules) {
        public static ScheduleCreationResult success(List<ProductionSchedule> schedules) {
            return new ScheduleCreationResult(true, "OK", schedules);
        }

        public static ScheduleCreationResult fail(String message) {
            return new ScheduleCreationResult(false, message, List.of());
        }
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
        log.setLine(schedule.getPlan().getLine()); // ← FIX
        log.setIncidentType("PAUSE");
        log.setSeverity("LOW"); // ← BONUS
        log.setDescription("Resumed by " + account.getUser().getLastName());
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

        IncidentLog log = new IncidentLog();
        log.setSchedule(schedule);
        log.setLine(schedule.getPlan().getLine());
        log.setIncidentType("RESUME");
        log.setSeverity("LOW");
        log.setDescription("Resumed by " + account.getUser().getLastName());
        log.setTimestamp(OffsetDateTime.now());
        incidentRepo.save(log);
    }

}
