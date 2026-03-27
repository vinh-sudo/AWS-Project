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
import be.backend.service.ProductionFileService;
import be.backend.mapper.ProductionFileMapper;
import be.backend.service.utilities.SNSService;
import be.backend.service.utilities.SQSService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LeaderProgressService {

        private static final String ORDER_STATUS_SCHEDULED = "SCHEDULED";
        private static final String ORDER_STATUS_PARTIALLY_SCHEDULED = "PARTIALLY_SCHEDULED";
        private static final String ORDER_STATUS_IN_PROGRESS = "IN_PROGRESS";
        private static final String ORDER_STATUS_COMPLETED = "COMPLETED";

        private final LineLeaderAssignmentRepository assignmentRepo;
        private final ProductionScheduleRepository scheduleRepo;
        private final ProductionProgressRepository progressRepo;
        private final ReportRepository reportRepo;
        private final OrderRepository orderRepo;
        private final OrderItemRepository orderItemRepo;
        private final ProductionFileService productionFileService;
        private final ProductionFileMapper productionFileMapper;
        private final SNSService snsService;
        private final SQSService sqsService;

        @Value("${aws.sns-topic-arn}")
        private String snsTopicArn;
        @Value("${aws.sqs-queue-url}")
        private String sqsQueueUrl;

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
                        throw new ForbiddenException("Schedule does not belong to your line");
                }

                // 3. Business rule: chỉ schedule RUNNING mới update được
                if (!"RUNNING".equals(schedule.getStatus())) {
                        throw new BusinessException(
                                        "Can only update progress for RUNNING schedules, current: "
                                                        + schedule.getStatus());
                }

                ProgressResponse response = refreshProgressFromReports(schedule);
                autoCompleteScheduleIfNeeded(schedule);
                return response;
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

                ProgressResponse latestProgress = refreshProgressFromReports(schedule);
                autoCompleteScheduleIfNeeded(schedule);
                Integer orderItemId = schedule.getPlan().getOrderItem() != null
                                ? schedule.getPlan().getOrderItem().getId()
                                : null;

                return ReportResponse.builder()
                                .reportId(report.getId())
                                .scheduleId(schedule.getId())
                                .orderId(order.getId())
                                .orderItemId(orderItemId)
                                .lineId(line.getId())
                                .lineName(line.getLineName())
                                .workDate(report.getWorkDate())
                                .shift(report.getShift())
                                .goodQuantity(report.getGoodQuantity())
                                .rejectQuantity(report.getRejectQuantity())
                                .targetQuantity(report.getTargetQuantity())
                                .scheduleCompletionPercentage(latestProgress.getPercentage())
                                .orderItemCompletionPercentage(latestProgress.getOrderItemCompletionPercentage())
                                .orderCompletionPercentage(latestProgress.getOrderCompletionPercentage())
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

                // 1. Resolve leader
                LineLeaderAssignment assignment = resolveAssignment(account);
                Integer leaderLineId = assignment.getLine().getId();

                // 2. Tìm schedule + verify ownership
                ProductionSchedule schedule = scheduleRepo.findById(scheduleId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Schedule", scheduleId.toString()));

                if (!schedule.getPlan().getLine().getId().equals(leaderLineId)) {
                        throw new ForbiddenException("Schedule does not belong to your line");
                }

                // 3. GUARD: Chỉ SCHEDULED mới start được
                if (!"SCHEDULED".equals(schedule.getStatus())) {
                        throw new BusinessException(
                                        "Only SCHEDULED can be started. Current: " + schedule.getStatus());
                }

                // 4. Stage dependency guard: SMT must start before later stages of same order item
                ProductionPlan plan = schedule.getPlan();
                OrderItem orderItem = plan.getOrderItem();
                if (orderItem != null) {
                        int currentRank = routeRank(plan.getLine().getLineName());
                        // rank 0 = SMT; only enforce dependency if this is not SMT or OTHER
                        if (currentRank > 0 && currentRank < 99) {
                                // Lấy tất cả schedule của cùng order item qua orderId và filter
                                List<ProductionSchedule> orderSchedules = scheduleRepo
                                                .findByOrderId(orderItem.getOrder().getId());

                                boolean hasPreviousStageStarted = orderSchedules.stream()
                                                .filter(s -> s.getPlan() != null
                                                                && s.getPlan().getOrderItem() != null
                                                                && s.getPlan().getOrderItem().getId()
                                                                                .equals(orderItem.getId()))
                                                .anyMatch(s -> {
                                                        int stageRank = routeRank(s.getPlan().getLine().getLineName());
                                                        // previous stage = lower rank (e.g. SMT before DIP)
                                                        if (stageRank >= currentRank) {
                                                                return false;
                                                        }
                                                        String st = s.getStatus();
                                                        return "RUNNING".equalsIgnoreCase(st)
                                                                        || "COMPLETED".equalsIgnoreCase(st);
                                                });

                                if (!hasPreviousStageStarted) {
                                        throw new BusinessException(
                                                        "Cannot start this stage before previous SMT/production stage has started");
                                }
                        }
                }

                // 5. Start schedule
                schedule.setStatus("RUNNING");
                scheduleRepo.save(schedule);

                // 5.1. Gửi notification qua SNS và SQS
                String message = String.format("Schedule %d started by leader %s", scheduleId, account.getUsername());
                snsService.publishToTopic(snsTopicArn, message, "Schedule Started");
                sqsService.sendMessage(sqsQueueUrl, message);

                // 6. Auto chuyển Order -> IN_PROGRESS khi có schedule chạy
                Order order = schedule.getOrder();
                if (ORDER_STATUS_SCHEDULED.equalsIgnoreCase(order.getStatus())
                                || ORDER_STATUS_PARTIALLY_SCHEDULED.equalsIgnoreCase(order.getStatus())) {
                        order.setStatus(ORDER_STATUS_IN_PROGRESS);
                        order.setUpdatedAt(OffsetDateTime.now());
                        orderRepo.save(order);
                }

                // 7. Lấy danh sách tài liệu (POM/SOP) của order để trả về cho leader
                List<ProductionFile> files = productionFileService.getFilesForOrder(order.getId());
                List<ProductionFileResponse> documentResponses = productionFileMapper.toResponseList(files);

                OrderItem item = schedule.getPlan().getOrderItem();

                return ScheduleSummaryResponse.builder()
                                .scheduleId(schedule.getId())
                                .orderInfo(schedule.getOrder().getId() + " - " + schedule.getOrder().getProductType())
                                .status(schedule.getStatus())
                                .startTime(schedule.getStartTime() != null
                                                ? schedule.getStartTime().toLocalDateTime()
                                                : null)
                                .endTime(schedule.getEndTime() != null
                                                ? schedule.getEndTime().toLocalDateTime()
                                                : null)
                                .orderItemId(item != null ? item.getId() : null)
                                .documents(documentResponses)
                                .build();
        }

        /**
         * Leader finish a running schedule on their line.
         * Business rule:
         *  - schedule must belong to leader's line
         *  - schedule must be RUNNING
         *  - when finished, status -> COMPLETED and progress/order completion are re-evaluated
         */
        /*
         * @Transactional public ScheduleSummaryResponse finishSchedule(Account account,
         * Integer scheduleId) {
         *
         * LineLeaderAssignment assignment = resolveAssignment(account); Integer
         * leaderLineId = assignment.getLine().getId();
         *
         * ProductionSchedule schedule = scheduleRepo.findById(scheduleId)
         * .orElseThrow(() -> new ResourceNotFoundException(
         * "Schedule", scheduleId.toString()));
         *
         * if (!schedule.getPlan().getLine().getId().equals(leaderLineId)) { throw new
         * ForbiddenException("Schedule does not belong to your line"); }
         *
         * if (!"RUNNING".equals(schedule.getStatus())) { throw new BusinessException(
         * "Only RUNNING schedules can be finished. Current: " + schedule.getStatus()); }
         *
         * // Kiểm tra tổng sản lượng đã đủ chưa Integer plannedQty =
         * schedule.getPlan().getPlannedQuantity(); Long producedQty =
         * reportRepo.sumProducedQuantityByScheduleId(schedule.getId()); if (producedQty
         * == null) producedQty = 0L; if (producedQty < plannedQty) { throw new
         * BusinessException("Cannot finish: Produced quantity (good + reject) " +
         * producedQty + " < planned quantity " + plannedQty); }
         *
         * // Mark schedule as completed and set end time if missing schedule.setStatus(
         * "COMPLETED"); if (schedule.getEndTime() == null) {
         * schedule.setEndTime(OffsetDateTime.now()); } scheduleRepo.save(schedule);
         *
         * // Recalculate order completion (will auto-complete order if 100%) BigDecimal
         * orderPercentage = calculateOrderCompletionPercentage(schedule.getOrder());
         * tryCompleteOrder(schedule.getOrder(), orderPercentage);
         *
         * // Build summary similar to startSchedule List<ProductionFile> files =
         * productionFileService.getFilesForOrder(schedule.getOrder().getId());
         * List<ProductionFileResponse> documentResponses =
         * productionFileMapper.toResponseList(files); OrderItem item =
         * schedule.getPlan().getOrderItem();
         *
         * return ScheduleSummaryResponse.builder() .scheduleId(schedule.getId())
         * .orderInfo(schedule.getOrder().getId() + " - " +
         * schedule.getOrder().getProductType()) .status(schedule.getStatus())
         * .startTime(schedule.getStartTime() != null
         * ? schedule.getStartTime().toLocalDateTime() : null)
         * .endTime(schedule.getEndTime() != null
         * ? schedule.getEndTime().toLocalDateTime() : null)
         * .orderItemId(item != null ? item.getId() : null)
         * .documents(documentResponses) .build(); }
         */

        private int routeRank(String lineName) {
                if (lineName == null) {
                        return 99;
                }
                String normalized = lineName.toUpperCase(Locale.ROOT);
                // Match actual line naming: "SMT Line", "DIP Line", "Assembly Line", "Testing Line", "Packing Line"
                if (normalized.contains("SMT")) {
                        return 0;
                }
                if (normalized.contains("DIP")) {
                        return 1;
                }
                if (normalized.contains("ASSEMBLY")) {
                        return 2;
                }
                if (normalized.contains("TEST")) {
                        return 3;
                }
                if (normalized.contains("PACK")) {
                        return 4;
                }
                return 99;
        }

        private BigDecimal calculateSchedulePercentage(ProductionSchedule schedule) {
                Integer plannedQty = schedule.getPlan().getPlannedQuantity();
                if (plannedQty == null || plannedQty <= 0) {
                        return BigDecimal.ZERO;
                }

                Long producedQtyRaw = reportRepo.sumGoodQuantityByScheduleId(schedule.getId());
                long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

                // Derive effective target based on route stage.
                // For the first stage (SMT, rank 0) we use planned quantity.
                // For downstream stages (DIP, Assembly, Testing, Packing),
                // effective target should not exceed the good quantity produced
                // by the previous stage for the same order item.
                BigDecimal effectiveTarget = BigDecimal.valueOf(plannedQty);

                ProductionPlan plan = schedule.getPlan();
                OrderItem orderItem = plan != null ? plan.getOrderItem() : null;
                if (orderItem != null) {
                        int currentRank = routeRank(plan.getLine().getLineName());
                        if (currentRank > 0 && currentRank < 99) {
                                // Find all schedules of the same order that belong to the previous stage(s)
                                List<ProductionSchedule> orderSchedules = scheduleRepo
                                                .findByOrderId(orderItem.getOrder().getId());

                                // Aggregate good quantity from strictly previous rank for this order item
                                long previousStageGoodQty = orderSchedules.stream()
                                                .filter(s -> s.getPlan() != null
                                                                && s.getPlan().getOrderItem() != null
                                                                && orderItem.getId().equals(
                                                                                s.getPlan().getOrderItem().getId()))
                                                .filter(s -> {
                                                        int stageRank = routeRank(s.getPlan().getLine().getLineName());
                                                        return stageRank == currentRank - 1; // direct previous stage
                                                })
                                                .mapToLong(s -> {
                                                        Long qty = reportRepo
                                                                        .sumGoodQuantityByScheduleId(s.getId());
                                                        return qty == null ? 0L : qty;
                                                })
                                                .sum();

                                if (previousStageGoodQty > 0) {
                                        effectiveTarget = effectiveTarget
                                                        .min(BigDecimal.valueOf(previousStageGoodQty));
                                }
                        }
                }

                if (effectiveTarget.compareTo(BigDecimal.ZERO) <= 0) {
                        return BigDecimal.ZERO;
                }

                BigDecimal percentage = BigDecimal.valueOf(producedQty)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(effectiveTarget, 2, RoundingMode.HALF_UP);

                return percentage.min(BigDecimal.valueOf(100));
        }

        private BigDecimal calculateOrderCompletionPercentage(Order order) {
                int orderQty = orderItemRepo.findByOrderId(order.getId()).stream()
                                .mapToInt(OrderItem::getQuantity)
                                .sum();
                if (orderQty <= 0) {
                        return BigDecimal.ZERO;
                }

                Long producedQtyRaw = reportRepo.sumGoodQuantityByOrderId(order.getId());
                long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

                BigDecimal percentage = BigDecimal.valueOf(producedQty)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(orderQty), 2, RoundingMode.HALF_UP);

                return percentage.min(BigDecimal.valueOf(100));
        }

        private BigDecimal calculateOrderItemCompletionPercentage(OrderItem orderItem) {
                if (orderItem == null || orderItem.getQuantity() == null || orderItem.getQuantity() <= 0) {
                        return BigDecimal.ZERO;
                }

                Long producedQtyRaw = reportRepo.sumGoodQuantityByOrderItemId(orderItem.getId());
                long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

                BigDecimal percentage = BigDecimal.valueOf(producedQty)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(orderItem.getQuantity()), 2, RoundingMode.HALF_UP);

                return percentage.min(BigDecimal.valueOf(100));
        }

        // Check whether a single order item has all 5 logical stages completed
        // Stages are derived from lineName via routeRank():
        //  0: SMT, 1: DIP, 2: Assembly, 3: Testing, 4: Packing
        private boolean isOrderItemRouteCompleted(OrderItem orderItem) {
                if (orderItem == null || orderItem.getOrder() == null) {
                        return false;
                }

                List<ProductionSchedule> orderSchedules = scheduleRepo
                                .findByOrderId(orderItem.getOrder().getId());

                boolean hasSMT = false;
                boolean hasDIP = false;
                boolean hasAssembly = false;
                boolean hasTesting = false;
                boolean hasPacking = false;

                for (ProductionSchedule s : orderSchedules) {
                        if (s.getPlan() == null || s.getPlan().getOrderItem() == null) {
                                continue;
                        }
                        if (!orderItem.getId().equals(s.getPlan().getOrderItem().getId())) {
                                continue;
                        }
                        if (!"COMPLETED".equalsIgnoreCase(s.getStatus())) {
                                continue;
                        }

                        int rank = routeRank(s.getPlan().getLine().getLineName());
                        if (rank == 0) {
                                hasSMT = true;
                        } else if (rank == 1) {
                                hasDIP = true;
                        } else if (rank == 2) {
                                hasAssembly = true;
                        } else if (rank == 3) {
                                hasTesting = true;
                        } else if (rank == 4) {
                                hasPacking = true;
                        }
                }

                // Require all 5 stages: SMT, DIP, Assembly, Testing, Packing
                return hasSMT && hasDIP && hasAssembly && hasTesting && hasPacking;
        }

        // Check that all order items of an order have their 5-stage route completed
        private boolean isOrderRouteCompleted(Order order) {
                List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
                if (items.isEmpty()) {
                        return false;
                }
                for (OrderItem item : items) {
                        if (!isOrderItemRouteCompleted(item)) {
                                return false;
                        }
                }
                return true;
        }

        private ProgressResponse refreshProgressFromReports(ProductionSchedule schedule) {
                BigDecimal schedulePercentage = calculateSchedulePercentage(schedule);
                BigDecimal orderPercentage = calculateOrderCompletionPercentage(schedule.getOrder());
                OrderItem orderItem = schedule.getPlan().getOrderItem();
                BigDecimal orderItemPercentage = calculateOrderItemCompletionPercentage(orderItem);

                ProductionProgress progress = new ProductionProgress();
                progress.setSchedule(schedule);
                progress.setPercentage(schedulePercentage);
                progress.setStatus("IN_PROGRESS");

                if (schedulePercentage.compareTo(BigDecimal.valueOf(100)) >= 0) {
                        progress.setStatus("COMPLETED");
                        schedule.setStatus("COMPLETED");
                        scheduleRepo.save(schedule);
                }

                progressRepo.save(progress);
                tryCompleteOrder(schedule.getOrder(), orderPercentage);

                return ProgressResponse.builder()
                                .scheduleId(schedule.getId())
                                .orderItemId(orderItem != null ? orderItem.getId() : null)
                                .percentage(schedulePercentage)
                                .orderItemCompletionPercentage(orderItemPercentage)
                                .orderCompletionPercentage(orderPercentage)
                                .scheduleStatus(schedule.getStatus())
                                .message("COMPLETED".equals(progress.getStatus())
                                                ? "Schedule completed!"
                                                : "Progress auto-updated to " + schedulePercentage + "%")
                                .build();
        }

        private void tryCompleteOrder(Order order, BigDecimal orderPercentage) {
                if (ORDER_STATUS_COMPLETED.equalsIgnoreCase(order.getStatus())) {
                        return;
                }

                // Only allow marking order as COMPLETED when
                // 1) quantity-based completion is 100%
                // 2) all 5 logical stages (SMT, DIP, Assembly, Testing, Packing)
                //    are completed for every order item
                if (orderPercentage.compareTo(BigDecimal.valueOf(100)) >= 0 && isOrderRouteCompleted(order)) {
                        order.setStatus(ORDER_STATUS_COMPLETED);
                        order.setUpdatedAt(OffsetDateTime.now());
                        orderRepo.save(order);
                }

        }

        private void autoCompleteScheduleIfNeeded(ProductionSchedule schedule) {
                Integer plannedQty = schedule.getPlan().getPlannedQuantity();
                Long producedQty = reportRepo.sumProducedQuantityByScheduleId(schedule.getId());
                if (producedQty == null) producedQty = 0L;
                if (producedQty >= plannedQty && "RUNNING".equals(schedule.getStatus())) {
                        schedule.setStatus("COMPLETED");
                        if (schedule.getEndTime() == null) {
                                schedule.setEndTime(OffsetDateTime.now());
                        }
                        scheduleRepo.save(schedule);
                        // Recalculate order completion (will auto-complete order if 100%)
                        BigDecimal orderPercentage = calculateOrderCompletionPercentage(schedule.getOrder());
                        tryCompleteOrder(schedule.getOrder(), orderPercentage);
                }
        }
}
