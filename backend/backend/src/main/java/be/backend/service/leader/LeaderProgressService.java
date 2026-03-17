package be.backend.service.leader;

import be.backend.entity.*;
import be.backend.exception.BusinessException;
import be.backend.exception.ForbiddenException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.request.SubmitReportRequest;
import be.backend.model.request.UpdateProgressRequest;
import be.backend.model.response.ProgressResponse;
import be.backend.model.response.ReportResponse;
import be.backend.model.response.ScheduleSummaryResponse;
import be.backend.model.response.ProductionFileResponse;
import be.backend.repository.*;
import be.backend.mapper.ProductionFileMapper;
import be.backend.service.ProductionFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderProgressService {

        private final LineLeaderAssignmentRepository assignmentRepo;
        private final ProductionScheduleRepository scheduleRepo;
        private final ProductionProgressRepository progressRepo;
        private final ReportRepository reportRepo;
        private final OrderRepository orderRepo;
        private final ProductionFileService productionFileService;
        private final ProductionFileMapper productionFileMapper;

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
                                        "Can only update progress for RUNNING schedules, current: "
                                                        + schedule.getStatus());
                }

                // Auto-calculate progress from cumulative reported output of this schedule.
                Integer scheduleId = schedule.getId();
                Long totalGoodQty = reportRepo.sumGoodQuantityByScheduleId(scheduleId);
                long producedQty = totalGoodQty == null ? 0L : totalGoodQty;

                Integer plannedQuantity = schedule.getPlan().getPlannedQuantity();
                if (plannedQuantity == null || plannedQuantity <= 0) {
                        throw new BusinessException("Planned quantity is invalid for progress calculation");
                }

                BigDecimal percentage = BigDecimal.valueOf(producedQty)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(plannedQuantity), 2, RoundingMode.HALF_UP);

                if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
                        percentage = BigDecimal.valueOf(100);
                }

                ProductionProgress progress = new ProductionProgress();
                progress.setSchedule(schedule);
                progress.setPercentage(percentage);
                progress.setStatus("IN_PROGRESS");

                // 5. Auto-complete if calculated percentage reaches 100%.
                if (percentage.compareTo(BigDecimal.valueOf(100)) >= 0) {
                        progress.setStatus("COMPLETED");
                        schedule.setStatus("COMPLETED");
                        scheduleRepo.save(schedule);

                        tryCompleteOrder(schedule.getOrder());
                }

                progressRepo.save(progress);

                return ProgressResponse.builder()
                                .scheduleId(schedule.getId())
                                .percentage(percentage)
                                .scheduleStatus(schedule.getStatus())
                                .message("COMPLETED".equals(progress.getStatus())
                                                ? "Schedule completed!"
                                                : "Progress auto-updated to " + percentage + "%")
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
                ProductionSchedule schedule = scheduleRepo.findById(request.getScheduleId())
                                .orElseThrow(() -> new ResourceNotFoundException("Schedule", request.getScheduleId().toString()));

                if (!schedule.getPlan().getLine().getId().equals(line.getId())) {
                        throw new ForbiddenException("Schedule does not belong to your line");
                }

                Order order = schedule.getOrder();

                // Duplicate check by schedule/day/shift.
                boolean exists = reportRepo.existsByEmployeeIdAndLineIdAndScheduleIdAndWorkDateAndShift(
                                employee.getId(), line.getId(), schedule.getId(), LocalDate.now(), request.getShift());

                if (exists) {
                        throw new BusinessException(
                                        "Report already submitted for shift " + request.getShift() + " today");
                }

                // 3. Build + Save
                Report report = new Report();
                report.setEmployee(employee);
                report.setLine(line);
                report.setSchedule(schedule);
                report.setOrder(order);
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
                                .scheduleId(schedule.getId())
                                .orderId(order.getId())
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

        /**
         * Leader start 1 schedule trên line mình quản lý
         *
         * WHY ở LeaderProgressService thay vì OrderService?
         * → SRP: OrderService quản lý Order CRUD (Admin concern)
         * → LeaderProgressService quản lý tiến độ sản xuất (Leader concern)
         * → Leader không biết Order là gì, chỉ biết Schedule
         *
         * WHY start Schedule thay vì Order?
         * → 1 Order có nhiều Plan → nhiều Schedule trên nhiều line
         * → Leader chỉ quản lý 1 line → chỉ start schedule thuộc line đó
         * → Order status = aggregate result, không phải action trực tiếp
         */
        @Transactional
        public ScheduleSummaryResponse startSchedule(Account account, Integer scheduleId) {

                // 1. Resolve leader → lấy lineId (reuse method đã có)
                LineLeaderAssignment assignment = resolveAssignment(account);
                Integer leaderLineId = assignment.getLine().getId();

                // 2. Tìm schedule + verify ownership
                ProductionSchedule schedule = scheduleRepo.findById(scheduleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Schedule", scheduleId.toString()));

                // 3. GUARD: Schedule phải thuộc line của leader
                // → Security: leader A không start schedule line B
                if (!schedule.getPlan().getLine().getId().equals(leaderLineId)) {
                        throw new ForbiddenException("Schedule does not belong to your line");
                }

                // 4. GUARD: Chỉ SCHEDULED mới start được
                // → Tránh start lại schedule đang RUNNING hoặc đã COMPLETED
                if (!"SCHEDULED".equals(schedule.getStatus())) {
                        throw new BusinessException(
                                        "Only SCHEDULED can be started. Current: " + schedule.getStatus());
                }

                // 5. Start schedule
                schedule.setStatus("RUNNING");
                scheduleRepo.save(schedule);

                // 6. Auto chuyển Order → "In Production" (nếu chưa)
                // → ORDER status là AGGREGATE: có ít nhất 1 schedule RUNNING → In Production
                Order order = schedule.getOrder();
                if ("Confirmed".equals(order.getStatus())) {
                        order.setStatus("In Production");
                        order.setUpdatedAt(OffsetDateTime.now());
                        orderRepo.save(order);
                }

                // 7. Lấy danh sách tài liệu (POM/SOP) của order để trả về cho leader
                List<ProductionFile> files = productionFileService.getFilesForOrder(order.getId());
                List<ProductionFileResponse> documentResponses = productionFileMapper.toResponseList(files);

                // 8. Build response (reuse DTO đã có, thêm documents)
                return ScheduleSummaryResponse.builder()
                                .scheduleId(schedule.getId())
                                .orderInfo(schedule.getOrder().getId() + " - " + schedule.getOrder().getProductType())
                                .status(schedule.getStatus())
                                .startTime(schedule.getStartTime().toLocalDateTime())
                                .endTime(schedule.getEndTime().toLocalDateTime())
                                .percentage(calculateSchedulePercentage(schedule))
                                .documents(documentResponses)
                                .build();
        }

        private BigDecimal calculateSchedulePercentage(ProductionSchedule schedule) {
                Integer plannedQty = schedule.getPlan().getPlannedQuantity();
                if (plannedQty == null || plannedQty <= 0) {
                        return BigDecimal.ZERO;
                }

                Long producedQtyRaw = reportRepo.sumGoodQuantityByScheduleId(schedule.getId());
                long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

                BigDecimal percentage = BigDecimal.valueOf(producedQty)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(plannedQty), 2, RoundingMode.HALF_UP);

                return percentage.min(BigDecimal.valueOf(100));
        }

        private void tryCompleteOrder(Order order) {
                // Chỉ order đang "In Production" mới cần check
                if (!"In Production".equals(order.getStatus())) {
                        return;
                }

                // Đếm schedule CHƯA COMPLETED của order này
                long pendingCount = scheduleRepo.countByOrderIdAndStatusNot(
                                order.getId(), "COMPLETED");

                if (pendingCount == 0) {
                        order.setStatus("Completed");
                        order.setUpdatedAt(OffsetDateTime.now());
                        orderRepo.save(order);
                }

        }
}