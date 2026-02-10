package be.backend.event;

import be.backend.entity.ProductionLine;
import be.backend.entity.ProductionSchedule;

public class ProductionScheduleEvent {

    public record ScheduleAssignedToLineEvent(ProductionSchedule schedule, ProductionLine line) {}

    public record ScheduleStartedEvent(ProductionSchedule schedule) {}
    public record ScheduleDelayedEvent(ProductionSchedule schedule) {}
    public record ScheduleRescheduledEvent(ProductionSchedule schedule) {}

}
