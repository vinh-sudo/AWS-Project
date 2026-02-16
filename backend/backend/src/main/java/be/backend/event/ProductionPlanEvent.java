package be.backend.event;

import be.backend.entity.ProductionPlan;

public record ProductionPlanEvent() {
    public record PlanCreatedEvent(ProductionPlan plan) {}
    public record PlanApprovedEvent(ProductionPlan plan) {}
    public record PlanCancelledEvent(ProductionPlan plan) {}

}
