package be.backend.model.response;

import lombok.Data;

@Data
public class ScheduleValidationResult {

    private boolean ok;
    private String message;

    public static ScheduleValidationResult success() {
        ScheduleValidationResult r = new ScheduleValidationResult();
        r.ok = true;
        r.message = "OK";
        return r;
    }

    public static ScheduleValidationResult fail(String msg) {
        ScheduleValidationResult r = new ScheduleValidationResult();
        r.ok = false;
        r.message = msg;
        return r;
    }
}
