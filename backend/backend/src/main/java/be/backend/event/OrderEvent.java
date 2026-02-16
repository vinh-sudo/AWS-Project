package be.backend.event;

import be.backend.entity.Order;

public record OrderEvent() {
    public record OrderCreatedEvent(Order order) {}
    public record OrderReleasedToProductionEvent(Order order) {}
    public record OrderLateEvent(Order order) {}
    public record OrderCompletedEvent(Order order) {}

}
