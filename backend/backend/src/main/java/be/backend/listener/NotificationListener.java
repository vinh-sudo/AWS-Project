package be.backend.listener;

import be.backend.entity.*;
import be.backend.event.*;
import be.backend.repository.AccountRepository;
import be.backend.service.utilities.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationService notificationService;
    private final AccountRepository accountRepo;

    // ===================== ACCOUNT =====================

    @EventListener
    public void onUserCreated(AccountEvent.UserCreatedEvent e) {
        String message = String.format("Welcome %s! Your account has been created successfully.", e.user().getFirstName());
        notifyUser(e.user(),
                "Welcome",
                message,
                Map.of("name", e.user().getFirstName()),
                "INFO",
                "ACCOUNT",
                e.user().getId(),
                "/profile");
    }

    @EventListener
    public void onPasswordReset(AccountEvent.PasswordResetEvent e) {
        String message = "Your password has been reset. Please log in with your new password.";
        notifyUser(e.user(),
                "Password reset",
                message,
                Map.of(),
                "WARN",
                "ACCOUNT",
                e.user().getId(),
                "/security");
    }

    @EventListener
    public void onRoleChanged(AccountEvent.RoleChangedEvent e) {
        String message = String.format("Your role has been changed to %s.", e.account().getRole());
        notifyUser(e.account().getUser(),
                "Role changed",
                message,
                Map.of("role", e.account().getRole()),
                "INFO",
                "ACCOUNT",
                e.account().getId(),
                "/account");
    }

    @EventListener
    public void onAccountLocked(AccountEvent.AccountLockedEvent e) {
        String message = "Your account has been locked. Please contact support for assistance.";
        notifyUser(e.account().getUser(),
                "Account locked",
                message,
                Map.of(),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/support");

        String adminMsg = String.format("User %s has been locked.", e.account().getUsername());
        notifyRole("ADMIN",
                "User locked",
                adminMsg,
                Map.of("username", e.account().getUsername()),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/admin/accounts");
    }

    // ===================== EMPLOYEE =====================

    @EventListener
    public void onAssigned(EmployeeEvent.EmployeeAssignedToLineEvent e) {
        String message = String.format("You have been assigned to line: %s.", e.line().getLineName());
        Map<String, Object> payload = Map.of(
                "line", e.line().getLineName()
        );
        notifyUser(
                e.employee().getUser(),
                "Assigned to line",
                message,
                payload,
                "INFO",
                "LINE",
                e.line().getId(),
                "/my-line"
        );
    }

    @EventListener
    public void onRemoved(EmployeeEvent.EmployeeRemovedFromLineEvent e) {
        String message = String.format("You have been removed from line: %s.", e.line().getLineName());
        notifyUser(e.employee().getUser(),
                "Removed from line",
                message,
                Map.of("line", e.line().getLineName()),
                "WARN",
                "LINE",
                e.line().getId(),
                "/my-line");

        String managerMsg = String.format("Employee %s has been removed from line %s.", e.employee().getEmployeeCode(), e.line().getLineName());
        notifyRole("MANAGER",
                "Employee removed",
                managerMsg,
                Map.of(
                        "employee", e.employee().getEmployeeCode(),
                        "line", e.line().getLineName()
                ),
                "WARN",
                "LINE",
                e.line().getId(),
                "/lines/" + e.line().getId());
    }

    // ===================== SCHEDULE =====================

    @EventListener
    public void onScheduleAssigned(ProductionScheduleEvent.ScheduleAssignedToLineEvent e) {
        var line = e.line();
        var leader = line.getLineLeaderAssignment().getLeader();
        String message = String.format("A new schedule (ID: %d) has been assigned to line %s. Start time: %s.",
                e.schedule().getId(), line.getLineName(), e.schedule().getStartTime());
        Map<String, Object> payload = Map.of(
                "lineName", line.getLineName(),
                "scheduleId", e.schedule().getId(),
                "startTime", e.schedule().getStartTime()
        );
        notifyUser(
                leader.getUser(),
                "New schedule",
                message,
                payload,
                "INFO",
                "SCHEDULE",
                e.schedule().getId(),
                "/leader/schedules/" + e.schedule().getId()
        );
    }

    // ===================== REPORT =====================

    @EventListener
    public void onDailyReport(ReportEvent.DailyReportSubmittedEvent e) {
        String message = String.format("Daily report submitted for line %s. Good: %d, Reject: %d, Target: %d.",
                e.report().getLine().getLineName(), e.report().getGoodQuantity(), e.report().getRejectQuantity(), e.report().getTargetQuantity());
        Map<String, Object> payload = Map.of(
                "line", e.report().getLine().getLineName(),
                "good", e.report().getGoodQuantity(),
                "reject", e.report().getRejectQuantity(),
                "target", e.report().getTargetQuantity()
        );
        notifyRole(
                "LINE_LEADER",
                "Daily report",
                message,
                payload,
                "INFO",
                "REPORT",
                e.report().getId(),
                "/reports/" + e.report().getId()
        );
    }

    @EventListener
    public void onLowKpi(ReportEvent.LowKpiEvent e) {
        String message = String.format("Low KPI detected for line %s. Good: %d, Reject: %d, Target: %d.",
                e.report().getLine().getLineName(), e.report().getGoodQuantity(), e.report().getRejectQuantity(), e.report().getTargetQuantity());
        notifyRole("MANAGER",
                "Low KPI",
                message,
                Map.of(
                        "line", e.report().getLine().getLineName(),
                        "good", e.report().getGoodQuantity(),
                        "reject", e.report().getRejectQuantity(),
                        "target", e.report().getTargetQuantity()
                ),
                "WARN",
                "KPI",
                e.report().getId(),
                "/dashboard/kpi");
    }

    // ===================== ORDER =====================

    @EventListener
    public void onOrderCreated(OrderEvent.OrderCreatedEvent e) {
        var o = e.order();
        String message = String.format("New order #%d created for customer %s, product %s, quantity %d, deadline %s.",
                o.getId(), o.getCustomerName(), o.getProductType(), o.getQuantity(), o.getDeadline());
        Map<String, Object> payload = Map.of(
                "orderId", o.getId(),
                "customer", o.getCustomerName(),
                "product", o.getProductType(),
                "quantity", o.getQuantity(),
                "deadline", o.getDeadline()
        );
        notifyRole(
                "ADMIN",
                "New order created",
                message,
                payload,
                "INFO",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
    }

    @EventListener
    public void onOrderReleased(OrderEvent.OrderReleasedToProductionEvent e) {
        var o = e.order();
        String message = String.format("Order #%d for customer %s has been released to production. Product: %s, quantity: %d.",
                o.getId(), o.getCustomerName(), o.getProductType(), o.getQuantity());
        notifyRole(
                "ADMIN",
                "Order released to production",
                message,
                Map.of(
                        "orderId", o.getId(),
                        "customer", o.getCustomerName(),
                        "product", o.getProductType(),
                        "quantity", o.getQuantity()
                ),
                "WARN",
                "ORDER",
                o.getId(),
                "/plans/create?orderId=" + o.getId()
        );
    }

    @EventListener
    public void onOrderLate(OrderEvent.OrderLateEvent e) {
        var o = e.order();
        String message = String.format("Order #%d for customer %s is late. Deadline: %s.",
                o.getId(), o.getCustomerName(), o.getDeadline());
        notifyRole(
                "MANAGER",
                "Order is late",
                message,
                Map.of(
                        "orderId", o.getId(),
                        "customer", o.getCustomerName(),
                        "deadline", o.getDeadline()
                ),
                "WARN",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
    }

    @EventListener
    public void onOrderCompleted(OrderEvent.OrderCompletedEvent e) {
        var o = e.order();
        String message = String.format("Order #%d for customer %s, product %s, quantity %d has been completed.",
                o.getId(), o.getCustomerName(), o.getProductType(), o.getQuantity());
        notifyRole(
                "LINE_LEADER",
                "Order completed",
                message,
                Map.of(
                        "orderId", o.getId(),
                        "customer", o.getCustomerName(),
                        "product", o.getProductType(),
                        "quantity", o.getQuantity()
                ),
                "INFO",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
    }

    // ===================== SCHEDULE EXTENDED =====================

    @EventListener
    public void onScheduleDelayed(ProductionScheduleEvent.ScheduleDelayedEvent e) {
        var s = e.schedule();
        String plannedEnd = (s.getPlan() != null && s.getPlan().getPlannedEndDate() != null) ? s.getPlan().getPlannedEndDate().toString() : "N/A";
        String actualEnd = s.getEndTime() != null ? s.getEndTime().toString() : "N/A";
        String lineName = (s.getPlan() != null && s.getPlan().getLine() != null) ? s.getPlan().getLine().getLineName() : "N/A";
        String message = String.format("Schedule #%d for line %s is delayed. Planned end: %s, actual end: %s.",
                s.getId(), lineName, plannedEnd, actualEnd);
        Map<String, Object> payload = Map.of(
                "scheduleId", s.getId(),
                "line", lineName,
                "plannedEnd", plannedEnd,
                "actualEnd", actualEnd
        );
        notifyRole("LINE_LEADER",
                "Schedule delayed",
                message,
                payload,
                "WARN",
                "SCHEDULE",
                s.getId(),
                "/leader/schedules/" + s.getId()
        );
        notifyRole("MANAGER",
                "Schedule delayed",
                message,
                payload,
                "WARN",
                "SCHEDULE",
                s.getId(),
                "/manager/schedules/" + s.getId()
        );
    }

    @EventListener
    public void onScheduleCompleted(ProductionScheduleEvent.ScheduleCompletedEvent e) {
        var s = e.schedule();
        String message = String.format("Schedule #%d for line %s has been completed. Actual end: %s.",
                s.getId(), s.getPlan().getLine().getLineName(), s.getEndTime());
        Map<String, Object> payload = Map.of(
                "scheduleId", s.getId(),
                "line", s.getPlan().getLine().getLineName(),
                "actualEnd", s.getEndTime()
        );
        notifyRole("MANAGER",
                "Schedule completed",
                message,
                payload,
                "INFO",
                "SCHEDULE",
                s.getId(),
                "/manager/schedules/" + s.getId()
        );
    }

    @EventListener
    public void onSchedulePaused(ProductionScheduleEvent.SchedulePausedEvent e) {
        var s = e.schedule();
        String message = String.format("Schedule #%d for line %s has been paused.",
                s.getId(), s.getPlan().getLine().getLineName());
        Map<String, Object> payload = Map.of(
                "scheduleId", s.getId(),
                "line", s.getPlan().getLine().getLineName()
        );
        notifyRole("LINE_LEADER",
                "Schedule paused",
                message,
                payload,
                "WARN",
                "SCHEDULE",
                s.getId(),
                "/leader/schedules/" + s.getId()
        );
    }

    @EventListener
    public void onScheduleResumed(ProductionScheduleEvent.ScheduleResumedEvent e) {
        var s = e.schedule();
        String message = String.format("Schedule #%d for line %s has been resumed.",
                s.getId(), s.getPlan().getLine().getLineName());
        Map<String, Object> payload = Map.of(
                "scheduleId", s.getId(),
                "line", s.getPlan().getLine().getLineName()
        );
        notifyRole("LINE_LEADER",
                "Schedule resumed",
                message,
                payload,
                "INFO",
                "SCHEDULE",
                s.getId(),
                "/leader/schedules/" + s.getId()
        );
    }

    // ===================== ORDER EXTENDED =====================

    @EventListener
    public void onOrderCancelled(OrderEvent.OrderCancelledEvent e) {
        var o = e.order();
        String message = String.format("Order #%d for customer %s has been cancelled. Product: %s, quantity: %d.",
                o.getId(), o.getCustomerName(), o.getProductType(), o.getQuantity());
        Map<String, Object> payload = Map.of(
                "orderId", o.getId(),
                "customer", o.getCustomerName(),
                "product", o.getProductType(),
                "quantity", o.getQuantity()
        );
        notifyRole("ADMIN",
                "Order cancelled",
                message,
                payload,
                "ERROR",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
        notifyRole("MANAGER",
                "Order cancelled",
                message,
                payload,
                "ERROR",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
    }

    // ===================== QUALITY EXTENDED =====================

    @EventListener
    public void onHighRejectRate(ReportEvent.HighRejectRateEvent e) {
        var r = e.report();
        String message = String.format("High reject rate detected for line %s. Reject: %d, Good: %d, Target: %d.",
                r.getLine().getLineName(), r.getRejectQuantity(), r.getGoodQuantity(), r.getTargetQuantity());
        Map<String, Object> payload = Map.of(
                "line", r.getLine().getLineName(),
                "reject", r.getRejectQuantity(),
                "good", r.getGoodQuantity(),
                "target", r.getTargetQuantity()
        );
        notifyRole("MANAGER",
                "High reject rate",
                message,
                payload,
                "ERROR",
                "QUALITY",
                r.getId(),
                "/dashboard/quality"
        );
        notifyRole("MANAGER",
                "High reject rate",
                message,
                payload,
                "ERROR",
                "QUALITY",
                r.getId(),
                "/dashboard/quality"
        );
    }

    // ===================== MACHINE =====================
    @EventListener
    public void onMachineDownEvent(MachineEvent.MachineDownEvent e) {
        Machine machine = e.machine();
        String message = String.format("Máy %s (ID: %d) đã gặp sự cố!", machine.getMachineName(), machine.getId());
        notifyRole("MANAGER",
                "Sự cố máy móc",
                message,
                Map.of("machineId", machine.getId(), "machineName", machine.getMachineName()),
                "ERROR",
                "MACHINE",
                machine.getId(),
                "/machines/" + machine.getId());
        notifyRole("ADMIN",
                "Sự cố máy móc",
                message,
                Map.of("machineId", machine.getId(), "machineName", machine.getMachineName()),
                "ERROR",
                "MACHINE",
                machine.getId(),
                "/machines/" + machine.getId());
    }

    // ===================== CORE =====================

    private void notifyUser(User user,
                            String title,
                            String message,
                            Map<String, Object> payload,
                            String level,
                            String sourceType,
                            Integer sourceId,
                            String url) {

        notificationService.notifyStructured(
                user, title, message, payload, level, sourceType, sourceId, url
        );
    }

    private void notifyRole(String role,
                            String title,
                            String message,
                            Map<String, Object> payload,
                            String level,
                            String sourceType,
                            Integer sourceId,
                            String url) {

        accountRepo.findByRoleIgnoreCase(role)
                .stream()
                .map(Account::getUser)
                .forEach(u ->
                        notificationService.notifyStructured(
                                u, title, message, payload, level, sourceType, sourceId, url
                        )
                );
    }
}
