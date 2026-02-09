package be.backend.event;

public record Domain() {
    public record OrderCreatedEvent(Integer orderId, Integer createdBy) {}
    public record OrderDelayedEvent(Integer orderId, int delayDays) {}
    public record PlanApprovedEvent(Integer planId) {}
    public record ScheduleConflictEvent(Integer scheduleId, String line) {}
    public record EmployeeAssignedEvent(Integer employeeId, String line) {}
}
