package be.backend.enums;

import be.backend.exception.BusinessException;

/**
 * Categorical Logging Strategy:
 * - SECURITY: Login fail, Role change, Account lock/unlock → Keep 1 year
 * - DATA_CHANGE: Create/Update/Delete entities → Keep 6 months
 * - OPERATIONAL: Progress, Reports → Keep 3 months
 */
public enum ActionType {
    
    // ========== AUTHENTICATION (Security - 1 year) ==========
    LOGIN,
    LOGOUT,
    LOGIN_FAILED,       // Sau 5 lần fail → audit
    
    // ========== ACCOUNT (Security + Data - 6-12 months) ==========
    CREATE_ACCOUNT,
    UPDATE_ACCOUNT,
    DELETE_ACCOUNT,
    CHANGE_ROLE,        // CRITICAL - keep 1 year
    LOCK_ACCOUNT,       // CRITICAL
    UNLOCK_ACCOUNT,     // CRITICAL
    
    // ========== ORDER (Data Change - 6 months) ==========
    CREATE_ORDER,
    UPDATE_ORDER,
    DELETE_ORDER,
    CONFIRM_ORDER,      // Status change
    CANCEL_ORDER,
    
    // ========== PLANNING (Data + Operational - 3-6 months) ==========
    CREATE_PLAN,
    UPDATE_PLAN,
    DELETE_PLAN,
    CONFIRM_PLAN,
    CANCEL_PLAN,
    
    // ========== SCHEDULE (Operational - 3 months) ==========
    CREATE_SCHEDULE,
    START_SCHEDULE,     // CRITICAL
    PAUSE_SCHEDULE,
    RESUME_SCHEDULE,
    COMPLETE_SCHEDULE,  // CRITICAL
    
    // ========== REPORTING (Operational - 3 months) ==========
    REPORT_PROGRESS,
    CREATE_REPORT,
    UPDATE_REPORT,
    
    // ========== ASSIGNMENT (Data Change - 6 months) ==========
    ASSIGN_LEADER,
    UNASSIGN_LEADER,
    
    // ========== SYSTEM (Low Priority - 1 month) ==========
    SYSTEM_ACTION;      // Auto-complete order, scheduled jobs
    
    /**
     * Check critical actions
     * Nguyên lý: Critical actions cần retention lâu hơn
     */
    public boolean isCritical() {
        return this == CHANGE_ROLE 
            || this == LOCK_ACCOUNT 
            || this == UNLOCK_ACCOUNT
            || this == DELETE_ACCOUNT
            || this == DELETE_ORDER
            || this == START_SCHEDULE
            || this == COMPLETE_SCHEDULE;
    }
    
    /**
     * Security-related actions → Keep 1 year (compliance)
     */
    public boolean isSecurityRelated() {
        return this == LOGIN_FAILED
            || this == CHANGE_ROLE
            || this == LOCK_ACCOUNT
            || this == UNLOCK_ACCOUNT
            || this == DELETE_ACCOUNT;
    }
    
    /**
     * Get retention days theo category
     * Nguyên lý: Different retention per importance
     * - Security: 365 days
     * - Critical: 180 days
     * - Normal: 90 days
     */
    public int getRetentionDays() {
        if (isSecurityRelated()) return 365;
        if (isCritical()) return 180;
        return 90;
    }
    
    /**
     * Fail-fast validation
     */
    public static ActionType fromString(String action) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("ActionType cannot be null");
        }
        try {
            return ActionType.valueOf(action.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid action: " + action);
        }
    }
}