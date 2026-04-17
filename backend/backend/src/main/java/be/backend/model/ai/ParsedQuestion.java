package be.backend.model.ai;

public class ParsedQuestion {

    public enum Domain { ORDER, SCHEDULE, GENERIC }

    private final Domain domain;
    private final Integer orderId;
    private final Integer scheduleId;
    private final String originalText;

    public ParsedQuestion(Domain domain, Integer orderId, Integer scheduleId, String originalText) {
        this.domain = domain;
        this.orderId = orderId;
        this.scheduleId = scheduleId;
        this.originalText = originalText;
    }

    public Domain getDomain() { return domain; }
    public Integer getOrderId() { return orderId; }
    public Integer getScheduleId() { return scheduleId; }
    public String getOriginalText() { return originalText; }


    public static ParsedQuestion generic(String text) {
        return new ParsedQuestion(Domain.GENERIC, null, null, text);
    }
}
