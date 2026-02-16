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
                "account-created.html",
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
                "password-reset.html",
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
                "role-changed.html",
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
                "account-locked.html",
                Map.of(),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/support");

        notifyRole("ADMIN",
                "User locked",
                "admin-user-locked.html",
                Map.of("username", e.account().getUsername()),
                "WARN",
                "ACCOUNT",
                e.account().getId(),
                "/admin/accounts");
    }

    // ===================== EMPLOYEE =====================

    @EventListener
    public void onAssigned(EmployeeEvent.EmployeeAssignedToLineEvent e) {
        notifyUser(e.employee().getUser(),
                "Assigned to line",
                "employee-assigned.html",
                Map.of("line", e.line().getLineName()),
                "INFO",
                "LINE",
                e.line().getId(),
                "/my-line");
    }

    @EventListener
    public void onRemoved(EmployeeEvent.EmployeeRemovedFromLineEvent e) {
        notifyUser(e.employee().getUser(),
                "Removed from line",
                "employee-removed.html",
                Map.of("line", e.line().getLineName()),
                "WARN",
                "LINE",
                e.line().getId(),
                "/my-line");

        notifyRole("MANAGER",
                "Employee removed",
                "manager-employee-removed.html",
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

        notifyUser(leader.getUser(),
                "New Schedule",
                "schedule-assigned.html",
                Map.of(
                        "line", line.getLineName(),
                        "scheduleId", e.schedule().getId(),
                        "start", e.schedule().getStartTime()
                ),
                "INFO",
                "SCHEDULE",
                e.schedule().getId(),
                "/leader/schedules/" + e.schedule().getId());
    }

    // ===================== REPORT =====================

    @EventListener
    public void onDailyReport(ReportEvent.DailyReportSubmittedEvent e) {
        notifyRole("MANAGER",
                "Daily report",
                "daily-report.html",
                Map.of(
                        "line", e.report().getLine().getLineName(),
                        "good", e.report().getGoodQuantity(),
                        "reject", e.report().getRejectQuantity(),
                        "target", e.report().getTargetQuantity()
                ),
                "INFO",
                "REPORT",
                e.report().getId(),
                "/reports/" + e.report().getId());
    }

    @EventListener
    public void onLowKpi(ReportEvent.LowKpiEvent e) {
        notifyRole("MANAGER",
                "Low KPI",
                "kpi-low.html",
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

        notifyRoleTemplate(
                "SALES",
                "New order created",
                "order-created",
                Map.of(
                        "orderId", o.getId(),
                        "customer", o.getCustomerName(),
                        "product", o.getProductType(),
                        "quantity", o.getQuantity(),
                        "deadline", o.getDeadline()
                ),
                "INFO",
                "ORDER",
                o.getId(),
                "/orders/" + o.getId()
        );
    }

    @EventListener
    public void onOrderReleased(OrderEvent.OrderReleasedToProductionEvent e) {
        var o = e.order();

        notifyRoleTemplate(
                "PLANNER",
                "Order released to production",
                "order-released",
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

        notifyRoleTemplate(
                "MANAGER",
                "Order is late",
                "order-late",
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

        notifyRoleTemplate(
                "SALES",
                "Order completed",
                "order-completed",
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
                            String template,
                            Map<String, Object> data,
                            String severity,
                            String type,
                            Integer sourceId,
                            String url) {

        notificationService.notifyFromTemplate(
                user, title, template, data, severity, type, sourceId, url
        );
    }

    private void notifyRole(String role,
                            String title,
                            String template,
                            Map<String, Object> data,
                            String severity,
                            String type,
                            Integer sourceId,
                            String url) {

        accountRepo.findByRoleIgnoreCase(role)
                .stream()
                .map(Account::getUser)
                .forEach(u ->
                        notificationService.notifyFromTemplate(
                                u, title, template, data, severity, type, sourceId, url
                        )
                );
    }


    private void notifyRoleTemplate(String role,
                                    String title,
                                    String template,
                                    Map<String, Object> data,
                                    String severity,
                                    String type,
                                    Integer sourceId,
                                    String url) {

        notifyRole(role, title, template, data, severity, type, sourceId, url);
    }
}
