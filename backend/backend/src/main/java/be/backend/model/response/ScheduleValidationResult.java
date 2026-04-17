package be.backend.model.response;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ScheduleValidationResult {

    private boolean ok;
    private String message;
    private String orderStatus;
    private List<Integer> confirmedOrderItemIds;
    private Map<Integer, String> failedOrderItems;

    public static ScheduleValidationResult success() {
        ScheduleValidationResult r = new ScheduleValidationResult();
        r.ok = true;
        r.message = "OK";
        return r;
    }

    public static ScheduleValidationResult success(String message) {
        ScheduleValidationResult r = success();
        r.message = message;
        return r;
    }

    public static ScheduleValidationResult fail(String msg) {
        ScheduleValidationResult r = new ScheduleValidationResult();
        r.ok = false;
        r.message = msg;
        return r;
    }
}
