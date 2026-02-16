package be.backend.event;

import be.backend.entity.Account;
import be.backend.entity.User;

public record AccountEvent() {
    public record UserCreatedEvent(User user) {}
    public record PasswordResetEvent(User user) {}
    public record RoleChangedEvent(Account account, String oldRole) {}
    public record AccountLockedEvent(Account account) {}

}
