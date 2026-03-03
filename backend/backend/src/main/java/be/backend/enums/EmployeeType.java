package be.backend.enums;

public enum EmployeeType {
    ADMIN,
    MANAGER,
    LINE_LEADER,
    PLANNER,
    WORKER;
    
    // Map từ Role sang EmployeeType
    public static EmployeeType fromRole(Role role) {
        return switch (role) {
            case ADMIN -> ADMIN;     
            case MANAGER -> MANAGER;
            case LINE_LEADER -> LINE_LEADER;
            case PRODUCTION_PLANNER -> PLANNER;
        };
    }
}