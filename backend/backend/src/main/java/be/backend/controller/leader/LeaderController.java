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
     * Dashboard tổng quan cho leader
     * 
     * WHY @AuthenticationPrincipal Account?
     * → Spring Security tự inject Account từ SecurityContext
     * → Không cần gọi SecurityContextHolder.getContext() thủ công
     * → Account đã được JwtAuthenticationFilter set vào context
     * 
     * WHY ResponseEntity thay vì return trực tiếp?
     * → Kiểm soát HTTP status code rõ ràng
     * → Consistency với các controller khác
     * → Có thể thêm custom header khi cần
     */
    @GetMapping("/dashboard")
    public ResponseEntity<LeaderDashboardResponse> dashboard(
            @AuthenticationPrincipal Account account) {
        return ResponseEntity.ok(dashboardService.getDashboard(account));
    }

    /**
     * Danh sách schedule đang active trên line
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<ScheduleSummaryResponse>> mySchedules(
            @AuthenticationPrincipal Account account) {
        return ResponseEntity.ok(dashboardService.getMySchedules(account));
    }


    /**
     * Submit báo cáo cuối ca
     * 
     * WHY HttpStatus.CREATED?
     * → POST tạo resource mới (Report) → HTTP 201 Created là chuẩn RESTful
     * → GET/PUT trả 200 OK, POST trả 201 Created
     */
    @PostMapping("/report")
    public ResponseEntity<ReportResponse> submitReport(
            @AuthenticationPrincipal Account account,
            @Valid @RequestBody SubmitReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(progressService.submitReport(account, request));
    }

    /**
     * Báo cáo sự cố
     * 
     * WHY void return + 201?
     * → Incident report không cần return data phức tạp
     * → Client chỉ cần biết thành công hay không
     * → Nếu sau cần return incident detail → thay đổi return type
     */
    @PostMapping("/incident")
    public ResponseEntity<Void> reportIncident(
            @AuthenticationPrincipal Account account,
            @Valid @RequestBody ReportIncidentRequest request) {
        incidentService.reportIncident(account, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** Leader start sản xuất trên 1 schedule */
    @PostMapping("/schedules/{id}/start")
    public ResponseEntity<ScheduleSummaryResponse> startSchedule(
            @AuthenticationPrincipal Account account,
            @PathVariable Integer id) {
        return ResponseEntity.ok(progressService.startSchedule(account, id));
    }

    /** Leader finish sản xuất trên 1 schedule */
    @PostMapping("/schedules/{id}/finish")
    public ResponseEntity<ScheduleSummaryResponse> finishSchedule(
            @AuthenticationPrincipal Account account,
            @PathVariable Integer id) {
        return ResponseEntity.ok(progressService.finishSchedule(account, id));
    }

}