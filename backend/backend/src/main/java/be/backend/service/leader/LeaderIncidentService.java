package be.backend.service.leader;

import be.backend.entity.*;
import be.backend.event.MachineEvent;
import be.backend.exception.ForbiddenException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.request.ReportIncidentRequest;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class LeaderIncidentService {

    private final LineLeaderAssignmentRepository assignmentRepo;
    private final ProductionScheduleRepository scheduleRepo;
    private final MachineRepository machineRepo;
    private final IncidentLogRepository incidentRepo;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Báo cáo sự cố
     * 
     * FLOW:
     * 1. Resolve leader → lấy line
     * 2. Tìm schedule → verify schedule thuộc line (ownership)
     * 3. Nếu có machineId → tìm machine → verify machine thuộc line
     * 4. Build IncidentLog → save
     * 5. Nếu severity=HIGH → publish event → notification tự xử lý
     * 
     * WHY verify cả machine thuộc line?
     * → Tránh leader gắn incident vào machine của line khác
     * → Defense in depth: không tin client data
     * 
     * WHY dùng ApplicationEventPublisher thay vì gọi NotificationService trực tiếp?
     * → Loose coupling: IncidentService không biết có bao nhiêu listener
     * → OCP: thêm listener mới (VD: send SMS) → không sửa service này
     * → Transaction boundary: event publish sau commit (nếu dùng @TransactionalEventListener)
     */
    @Transactional
    public void reportIncident(Account account, ReportIncidentRequest request) {

        // 1. Resolve leader
        LineLeaderAssignment assignment = resolveAssignment(account);
        ProductionLine line = assignment.getLine();
        Integer leaderLineId = line.getId();

        // 2. Verify schedule ownership
        ProductionSchedule schedule = scheduleRepo.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ProductionSchedule", request.getScheduleId().toString()));

        if (!schedule.getPlan().getLine().getId().equals(leaderLineId)) {
            throw new ForbiddenException("Schedule does not belong to your line");
        }

        // 3. Machine check (optional field)
        Machine machine = null;
        if (request.getMachineId() != null) {
            machine = machineRepo.findById(request.getMachineId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Machine", request.getMachineId().toString()));

            // Verify machine thuộc cùng line
            if (!machine.getLine().getId().equals(leaderLineId)) {
                throw new ForbiddenException("Machine does not belong to your line");
            }
        }

        // 4. Build + Save
        IncidentLog incident = new IncidentLog();
        incident.setLine(line);
        incident.setSchedule(schedule);
        incident.setMachine(machine);
        incident.setReportedBy(account.getEmployee());
        incident.setIncidentType(request.getIncidentType());
        incident.setSeverity(request.getSeverity());
        incident.setDescription(request.getDescription());
        incident.setTimestamp(OffsetDateTime.now());

        incidentRepo.save(incident);

        // 5. Publish event nếu severity HIGH → để NotificationListener bắt
        if ("HIGH".equals(request.getSeverity()) && machine != null) {
            eventPublisher.publishEvent(
                    new MachineEvent.MachineDownEvent(machine));
            // NOTE: MachineDownEvent nhận Machine
            // Nếu machine == null (sự cố line, không phải máy)
            // → cần tạo thêm event type VD: LineIncidentEvent
            // Hoặc skip publish khi machine == null
        }
    }

    private LineLeaderAssignment resolveAssignment(Account account) {
        if (account.getEmployee() == null) {
            throw new ForbiddenException("Account is not linked to any employee");
        }
        return assignmentRepo.findActiveByLeaderId(account.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active line assignment found"));
    }
}