package be.backend.controller.manager;

import be.backend.model.response.DelayResponse;
import be.backend.model.response.GanttItemResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.model.response.ManagerOrderProgressResponse;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.GanttService;
import be.backend.service.manager.OeeService;
import be.backend.service.manager.ManagerTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/tracking")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerTrackingController {

    private final OeeService oeeService;
    private final GanttService ganttService;
    private final DelayService delayService;
    private final ManagerTrackingService trackingService;

    @GetMapping("/oee")
    public List<OeeLineResponse> oee(@RequestParam LocalDate date) {
        return oeeService.calculate(date);
    }

    @GetMapping("/gantt")
    public List<GanttItemResponse> gantt(@RequestParam LocalDate date) {
        return ganttService.getGantt(date);
    }

    @GetMapping("/delays")
    public List<DelayResponse> delays() {
        return delayService.detect();
    }

    // New endpoint: detailed order progress view for managers
    @GetMapping("/orders/{orderId}/progress")
    public ManagerOrderProgressResponse getOrderProgress(@PathVariable Integer orderId) {
        return trackingService.getOrderProgress(orderId);
    }
}