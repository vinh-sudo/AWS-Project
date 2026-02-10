package be.backend.event;

import be.backend.entity.Employee;
import be.backend.entity.ProductionLine;

public record EmployeeEvent() {
    public record EmployeeAssignedToLineEvent(Employee employee, ProductionLine line) {}
    public record EmployeeMovedLineEvent(Employee employee, ProductionLine oldLine, ProductionLine newLine) {}
    public record EmployeeShiftChangedEvent(Employee employee, String oldShift, String newShift) {}
    public record EmployeeRemovedFromLineEvent(Employee employee, ProductionLine line) {}
    public record LineLeaderAssignedEvent(Employee leader, ProductionLine line) {}
}
