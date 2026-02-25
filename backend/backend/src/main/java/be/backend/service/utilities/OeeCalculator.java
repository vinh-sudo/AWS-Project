package be.backend.service.utilities;

/**
 * Stateless utility: chứa pure functions tính OEE metrics.
 * Không inject, không state → thread-safe, testable, reusable.
 */
public final class OeeCalculator {

    private OeeCalculator() {
        // Prevent instantiation — chỉ dùng static methods
    }

    /**
     * Availability = (Planned - Downtime) / Planned
     * @param plannedMinutes  tổng phút kế hoạch (VD: 8h = 480 min)
     * @param downtimeMinutes tổng phút dừng máy
     */
    public static double availability(double plannedMinutes, double downtimeMinutes) {
        if (plannedMinutes <= 0) return 0.0;
        return round((plannedMinutes - downtimeMinutes) / plannedMinutes);
    }

    /**
     * Performance = Actual Output / Target Output
     * @param goodQuantity  sản phẩm đạt
     * @param targetQuantity mục tiêu
     */
    public static double performance(long goodQuantity, long targetQuantity) {
        if (targetQuantity <= 0) return 0.0;
        return round((double) goodQuantity / targetQuantity);
    }

    /**
     * Quality = Good / (Good + Reject)
     * @param goodQuantity   sản phẩm đạt
     * @param rejectQuantity sản phẩm lỗi
     */
    public static double quality(long goodQuantity, long rejectQuantity) {
        long total = goodQuantity + rejectQuantity;
        if (total <= 0) return 0.0;
        return round((double) goodQuantity / total);
    }

    /**
     * OEE = Availability × Performance × Quality
     */
    public static double oee(double availability, double performance, double quality) {
        return round(availability * performance * quality);
    }

    /**
     * Convenience: tính OEE từ raw data trong 1 call
     */
    public static double computeOee(
            double shiftHours,
            long downtimeMinutes,
            long goodQuantity,
            long rejectQuantity,
            long targetQuantity
    ) {
        double a = availability(shiftHours * 60, downtimeMinutes);
        double p = performance(goodQuantity, targetQuantity);
        double q = quality(goodQuantity, rejectQuantity);
        return oee(a, p, q);
    }

    /**
     * Round to 3 decimal places (VD: 0.85312 → 0.853)
     */
    public static double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}