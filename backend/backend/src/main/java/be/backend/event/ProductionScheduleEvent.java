package be.backend.event;

import be.backend.entity.ProductionLine;
import be.backend.entity.ProductionSchedule;

public class ProductionScheduleEvent {

    public record ScheduleAssignedToLineEvent(ProductionSchedule schedule, ProductionLine line) {}

    public record ScheduleStartedEvent(ProductionSchedule schedule) {}
    public record ScheduleDelayedEvent(ProductionSchedule schedule) {}
    public record ScheduleCompletedEvent(ProductionSchedule schedule) {}
    public record SchedulePausedEvent(ProductionSchedule schedule) {}
    public record ScheduleResumedEvent(ProductionSchedule schedule) {}

}
