package be.backend.enums;

import be.backend.exception.BusinessException;

public enum Role {
    ADMIN,
    MANAGER,
    LINE_LEADER;
    
    // Helper method: check whether the role requires an Employee
    public boolean requiresEmployee() {
        return true;
    }
    
    // Helper method: safely convert from String
    public static Role fromString(String role) {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role cannot be null or empty");
        }
        
        String normalized = role.toUpperCase().trim().replace(" ", "_");
        
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
             throw new BusinessException("Invalid role: " + role + 
            ". Valid roles: ADMIN, MANAGER, LINE_LEADER");
        }
    }
}