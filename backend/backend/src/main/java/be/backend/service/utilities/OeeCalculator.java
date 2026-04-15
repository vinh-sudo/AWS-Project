package be.backend.service.utilities;

/**
 * Stateless utility: contains pure functions for calculating OEE metrics.
 * No injection, no state -> thread-safe, testable, reusable.
 */
public final class OeeCalculator {

    private OeeCalculator() {
        // Prevent instantiation - static methods only
    }

    /**
     * Availability = (Planned - Downtime) / Planned
    * @param plannedMinutes total planned minutes (e.g. 8h = 480 min)
    * @param downtimeMinutes total machine downtime minutes
     */
    public static double availability(double plannedMinutes, double downtimeMinutes) {
        if (plannedMinutes <= 0) return 0.0;
        return round((plannedMinutes - downtimeMinutes) / plannedMinutes);
    }

    /**
     * Performance = Actual Output / Target Output
    * @param goodQuantity good units
    * @param targetQuantity target units
     */
    public static double performance(long goodQuantity, long targetQuantity) {
        if (targetQuantity <= 0) return 0.0;
        return round((double) goodQuantity / targetQuantity);
    }

    /**
     * Quality = Good / (Good + Reject)
    * @param goodQuantity good units
    * @param rejectQuantity defective units
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
    * Convenience: calculate OEE from raw data in one call
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