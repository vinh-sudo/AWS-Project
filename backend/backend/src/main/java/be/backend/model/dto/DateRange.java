package be.backend.model.dto;

import be.backend.exception.BusinessException;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;

/**
 * Immutable Value Object đại diện cho khoảng thời gian query.
 * Tự validate khi khởi tạo → mọi nơi nhận DateRange đều yên tâm data hợp lệ.
 */
@Getter
public final class DateRange {

    private static final ZoneOffset ZONE = ZoneOffset.of("+07:00");
    private static final int MAX_DAYS = 365;

    private final LocalDate from;
    private final LocalDate to;

    // ==================== PRIVATE CONSTRUCTOR ====================

    private DateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new BusinessException("Date range: 'from' and 'to' are required");
        }
        if (from.isAfter(to)) {
            throw new BusinessException("Date range: 'from' must not be after 'to'");
        }
        if (from.plusDays(MAX_DAYS).isBefore(to)) {
            throw new BusinessException("Date range: maximum " + MAX_DAYS + " days allowed");
        }
        this.from = from;
        this.to = to;
    }

    // ==================== FACTORY METHODS ====================

    public static DateRange of(LocalDate from, LocalDate to) {
        return new DateRange(from, to);
    }

    public static DateRange today() {
        LocalDate now = LocalDate.now();
        return new DateRange(now, now);
    }

    public static DateRange thisWeek() {
        LocalDate now = LocalDate.now();
        LocalDate monday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return new DateRange(monday, now);
    }

    public static DateRange thisMonth() {
        LocalDate now = LocalDate.now();
        LocalDate first = now.with(TemporalAdjusters.firstDayOfMonth());
        return new DateRange(first, now);
    }

    /**
     * Parse từ request param "range" string.
     * Dùng trong controller khi endpoint nhận ?range=TODAY|WEEK|MONTH
     */
    public static DateRange fromRange(String range) {
        if (range == null || range.isBlank()) {
            return today();
        }
        return switch (range.toUpperCase().trim()) {
            case "TODAY" -> today();
            case "WEEK"  -> thisWeek();
            case "MONTH" -> thisMonth();
            default -> throw new BusinessException(
                    "Invalid range: " + range + ". Valid values: TODAY, WEEK, MONTH");
        };
    }

    public OffsetDateTime toStartOffset() {
        return from.atStartOfDay().atOffset(ZONE);
    }

    public OffsetDateTime toEndOffset() {
        return to.plusDays(1).atStartOfDay().atOffset(ZONE);
    }

//Display
    public String rangeLabel() {
        if (from.equals(to)) return "TODAY";
        if (from.equals(LocalDate.now().with(
                TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)))) return "WEEK";
        if (from.equals(LocalDate.now().with(
                TemporalAdjusters.firstDayOfMonth()))) return "MONTH";
        return "CUSTOM";
    }
}