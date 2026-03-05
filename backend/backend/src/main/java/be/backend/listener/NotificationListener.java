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
        notifyUser(e.user(),
                "Welcome",
                Map.of("name", e.user().getFirstName()),
                "INFO",
                "ACCOUNT",
                e.user().getId(),
                "/profile");
    }

    @EventListener
    public void onPasswordReset(AccountEvent.PasswordResetEvent e) {
        notifyUser(e.user(),
                "Password reset",
                Map.of(),
                "WARN",
                "ACCOUNT",
                e.user().getId(),
                "/security");
    }

    @EventListener
    public void onRoleChanged(AccountEvent.RoleChangedEvent e) {
        notifyUser(e.account().getUser(),
                "Role changed",
                Map.of("role", e.account().getRole()),
                "INFO",
                "ACCOUNT",
                e.account().getId(),
                "/account");
    }

    @EventListener
    public void onAccountLocked(AccountEvent.AccountLockedEvent e) {
        notifyUser(e.account().getUser(),
                "Account locked",
                Map.of(),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/support");

        notifyRole("ADMIN",
                "User locked",
                Map.of("username", e.account().getUsername()),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/admin/accounts");
    }

    // ===================== EMPLOYEE =====================

    @EventListener
    public void onAssigned(EmployeeEvent.EmployeeAssignedToLineEvent e) {
        Map<String, Object> payload = Map.of(
                "line", e.line().getLineName()
        );
        notifyUser(
                e.employee().getUser(),
                "Assigned to line",
                payload,
                "INFO",
                "LINE",
                e.line().getId(),
                "/my-line"
        );
    }

    @EventListener
    public void onRemoved(EmployeeEvent.EmployeeRemovedFromLineEvent e) {
        notifyUser(e.employee().getUser(),
                "Removed from line",
                Map.of("line", e.line().getLineName()),
                "WARN",
                "LINE",
                e.line().getId(),
                "/my-line");

        notifyRole("MANAGER",
                "Employee removed",
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

        Map<String, Object> payload = Map.of(
                "lineName", line.getLineName(),
                "scheduleId", e.schedule().getId(),
                "startTime", e.schedule().getStartTime()
        );
        notifyUser(
                leader.getUser(),
                "New schedule",
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
        Map<String, Object> payload = Map.of(
                "line", e.report().getLine().getLineName(),
                "good", e.report().getGoodQuantity(),
                "reject", e.report().getRejectQuantity(),
                "target", e.report().getTargetQuantity()
        );
        notifyRole(
                "LINE_LEADER",
                "Daily report",
                payload,
                "INFO",
                "REPORT",
                e.report().getId(),
                "/reports/" + e.report().getId()
        );
    }

    @EventListener
    public void onLowKpi(ReportEvent.LowKpiEvent e) {
        notifyRole("MANAGER",
                "Low KPI",
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

        notifyRole(
                "ADMIN",
                "Order released to production",
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

        notifyRole(
                "MANAGER",
                "Order is late",
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

        notifyRole(
                "LINE_LEADER",
                "Order completed",
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

    // ===================== CORE =====================

    private void notifyUser(User user,
                            String title,
                            Map<String, Object> payload,
                            String level,
                            String sourceType,
                            Integer sourceId,
                            String url) {

        notificationService.notifyStructured(
                user, title, payload, level, sourceType, sourceId, url
        );
    }

    private void notifyRole(String role,
                            String title,
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
                                u, title, payload, level, sourceType, sourceId, url
                        )
                );
    }
}
