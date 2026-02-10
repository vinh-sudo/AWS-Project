package be.backend.event;

import be.backend.entity.Machine;

public record MachineEvent() {
    public record MachineDownEvent(Machine machine) {}
    public record MachineRecoveredEvent(Machine machine) {}

}
