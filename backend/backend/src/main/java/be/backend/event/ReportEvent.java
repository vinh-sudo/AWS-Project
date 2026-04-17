package be.backend.event;

import be.backend.entity.Report;

public class ReportEvent {
    public record LowKpiEvent(Report report) {}
    public record HighRejectRateEvent(Report report) {}
    public record DailyReportSubmittedEvent(Report report) {}

}
