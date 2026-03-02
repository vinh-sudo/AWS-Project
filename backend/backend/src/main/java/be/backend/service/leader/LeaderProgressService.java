package be.backend.service.leader;

import be.backend.entity.*;
import be.backend.exception.BusinessException;
import be.backend.exception.ForbiddenException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.request.SubmitReportRequest;
import be.backend.model.request.UpdateProgressRequest;
import be.backend.model.response.ProgressResponse;
import be.backend.model.response.ReportResponse;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class LeaderProgressService {

    private final LineLeaderAssignmentRepository assignmentRepo;
    private final ProductionScheduleRepository scheduleRepo;
    private final ProductionProgressRepository progressRepo;
    private final ReportRepository reportRepo;

    /**
     * Cập nhật tiến độ schedule
     * 
     * FLOW:
     * 1. Xác minh leader → lấy lineId đang quản lý
     * 2. Tìm schedule → verify schedule thuộc line của leader (ownership check)
     * 3. Verify schedule đang RUNNING (business rule)
     * 4. Tạo mới ProductionProgress record (append-only, không update record cũ)
     * 5. Nếu percentage = 100 → auto complete schedule
     * 
     * WHY append-only thay vì update?
     * → Giữ lịch sử: 10% → 40% → 75% → 100%
     * → Audit trail: biết ai update lúc nào
     * → findLatestByScheduleId() luôn lấy record mới nhất
     * 
     * WHY check schedule.plan.line.id == assignment.line.id?
     * → Security: leader A không thể update progress của line B
     * → Nếu chỉ check scheduleId, leader có thể gửi scheduleId bất kỳ
     */
    @Transactional
    public ProgressResponse updateProgress(Account account, UpdateProgressRequest request) {

        // 1. Resolve leader's line
        LineLeaderAssignment assignment = resolveAssignment(account);
        Integer leaderLineId = assignment.getLine().getId();

        // 2. Find schedule + verify ownership
        ProductionSchedule schedule = scheduleRepo.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ProductionSchedule", request.getScheduleId().toString()));

        if (!schedule.getPlan().getLine().getId().equals(leaderLineId)) {
            throw new ForbiddenException(
                    "Schedule does not belong to your line");
        }

        // 3. Business rule: chỉ schedule RUNNING mới update được
        if (!"RUNNING".equals(schedule.getStatus())) {
            throw new BusinessException(
                    "Can only update progress for RUNNING schedules, current: " + schedule.getStatus());
        }

        // 4. Append new progress record
        ProductionProgress progress = new ProductionProgress();
        progress.setSchedule(schedule);
        progress.setPercentage(request.getPercentage());
        progress.setStatus("In Progress");

        // 5. Auto-complete nếu 100%
        if (request.getPercentage().intValue() >= 100) {
            progress.setStatus("Completed");
            schedule.setStatus("COMPLETED");
            scheduleRepo.save(schedule);
        }

        progressRepo.save(progress);

        return ProgressResponse.builder()
                .scheduleId(schedule.getId())
                .percentage(request.getPercentage())
                .scheduleStatus(schedule.getStatus())
                .message(progress.getStatus().equals("Completed")
                        ? "Schedule completed!"
                        : "Progress updated to " + request.getPercentage() + "%")
                .build();
    }

    /**
     * Submit báo cáo cuối ca
     * 
     * FLOW:
     * 1. Xác minh leader → lấy line
     * 2. Check trùng: đã có report cho (employee, line, ngày, ca) chưa?
     * 3. Build Report entity → save
     * 
     * WHY check trùng bằng existsByEmployeeIdAndLineIdAndWorkDateAndShift()?
     * → 1 leader chỉ submit 1 report / ca / ngày / line
     * → Race condition: nếu click 2 lần → DB sẽ có 2 bản ghi trùng
     * → Check trước giúp fail fast với message rõ ràng
     * 
     * NOTE: Nếu muốn atomically prevent duplicate, có thể thêm UNIQUE constraint
     * trên (employee_id, line_id, work_date, shift) ở DB layer
     * 
     * WHY dùng entity relationship (setEmployee, setLine) thay vì setEmployeeId?
     * → JPA manage FK qua entity reference
     * → Nếu dùng setEmployeeId → JPA không biết relationship → không cascade
     */
    @Transactional
    public ReportResponse submitReport(Account account, SubmitReportRequest request) {

        // 1. Resolve
        LineLeaderAssignment assignment = resolveAssignment(account);
        ProductionLine line = assignment.getLine();
        Employee employee = account.getEmployee();

        // 2. Duplicate check
        boolean exists = reportRepo.existsByEmployeeIdAndLineIdAndWorkDateAndShift(
                employee.getId(), line.getId(), LocalDate.now(), request.getShift());

        if (exists) {
            throw new BusinessException(
                    "Report already submitted for shift " + request.getShift() + " today");
        }

        // 3. Build + Save
        Report report = new Report();
        report.setEmployee(employee);
        report.setLine(line);
        report.setWorkDate(LocalDate.now());
        report.setShift(request.getShift());
        report.setTargetQuantity(request.getTargetQuantity());
        report.setGoodQuantity(request.getGoodQuantity());
        report.setRejectQuantity(request.getRejectQuantity());
        report.setDowntimeMinutes(request.getDowntimeMinutes());
        report.setNotes(request.getNotes());
        report.setCreatedAt(OffsetDateTime.now());

        reportRepo.save(report);

        return ReportResponse.builder()
                .reportId(report.getId())
                .lineId(line.getId())
                .lineName(line.getLineName())
                .workDate(report.getWorkDate())
                .shift(report.getShift())
                .goodQuantity(report.getGoodQuantity())
                .rejectQuantity(report.getRejectQuantity())
                .targetQuantity(report.getTargetQuantity())
                .message("Report submitted successfully")
                .build();
    }

    // =========== PRIVATE ===========

    /**
     * Cùng logic với LeaderDashboardService.resolveAssignment()
     * 
     * TRADEOFF:
     * → Duplicate code vs tạo shared helper
     * → Nếu chỉ 2-3 service dùng: duplicate OK, giữ service independent
     * → Nếu >3 service dùng: tạo LeaderAuthHelper @Component để DRY
     * 
     * DECISION: giữ duplicate cho bây giờ (2 service)
     * → Refactor khi có service thứ 3
     */
    private LineLeaderAssignment resolveAssignment(Account account) {
        if (account.getEmployee() == null) {
            throw new ForbiddenException("Account is not linked to any employee");
        }
        return assignmentRepo.findActiveByLeaderId(account.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active line assignment found"));
    }
}