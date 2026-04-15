package be.backend.controller.leader;

import be.backend.entity.Account;
import be.backend.model.request.ReportIncidentRequest;
import be.backend.model.request.SubmitReportRequest;
import be.backend.model.response.LeaderDashboardResponse;
import be.backend.model.response.ReportResponse;
import be.backend.model.response.ScheduleSummaryResponse;
import be.backend.service.leader.LeaderDashboardService;
import be.backend.service.leader.LeaderIncidentService;
import be.backend.service.leader.LeaderProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leader")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LINE_LEADER')")
public class LeaderController {

    private final LeaderDashboardService dashboardService;
    private final LeaderProgressService progressService;
    private final LeaderIncidentService incidentService;

    /**
     * Overview dashboard for leaders
     * 
     * WHY @AuthenticationPrincipal Account?
     * -> Spring Security injects the Account from the SecurityContext automatically
     * -> No need to call SecurityContextHolder.getContext() manually
     * -> The Account is already set in the context by JwtAuthenticationFilter
     * 
     * WHY ResponseEntity instead of returning directly?
     * -> Clear control over HTTP status codes
     * -> Consistency with other controllers
     * -> Custom headers can be added when needed
     */
    @GetMapping("/dashboard")
    public ResponseEntity<LeaderDashboardResponse> dashboard(
            @AuthenticationPrincipal Account account) {
        return ResponseEntity.ok(dashboardService.getDashboard(account));
    }

    /**
     * List active schedules on the line
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<ScheduleSummaryResponse>> mySchedules(
            @AuthenticationPrincipal Account account) {
        return ResponseEntity.ok(dashboardService.getMySchedules(account));
    }


    /**
     * Submit end-of-shift report
     * 
     * WHY HttpStatus.CREATED?
     * -> POST creates a new resource (Report) -> HTTP 201 Created is RESTful
     * -> GET/PUT return 200 OK, POST returns 201 Created
     */
    @PostMapping("/report")
    public ResponseEntity<ReportResponse> submitReport(
            @AuthenticationPrincipal Account account,
            @Valid @RequestBody SubmitReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(progressService.submitReport(account, request));
    }

    /**
     * Incident report
     * 
     * WHY void return + 201?
     * -> Incident reports do not need to return complex data
     * -> The client only needs to know whether it succeeded
     * -> If incident details are needed later, change the return type
     */
    @PostMapping("/incident")
    public ResponseEntity<Void> reportIncident(
            @AuthenticationPrincipal Account account,
            @Valid @RequestBody ReportIncidentRequest request) {
        incidentService.reportIncident(account, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** Leader starts production for one schedule */
    @PostMapping("/schedules/{id}/start")
    public ResponseEntity<ScheduleSummaryResponse> startSchedule(
            @AuthenticationPrincipal Account account,
            @PathVariable Integer id) {
        return ResponseEntity.ok(progressService.startSchedule(account, id));
    }


}