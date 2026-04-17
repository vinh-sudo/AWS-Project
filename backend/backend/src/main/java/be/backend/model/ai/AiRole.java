package be.backend.model.ai;

public enum AiRole {
    ADMIN,
    MANAGER,
    UNKNOWN;

    public static AiRole fromAuthority(String authority) {
        if (authority == null) {
            return UNKNOWN;
        }

        if (authority.contains("ADMIN")) {
            return ADMIN;
        }
        if (authority.contains("MANAGER")) {
            return MANAGER;
        }

        return UNKNOWN;
    }
}
