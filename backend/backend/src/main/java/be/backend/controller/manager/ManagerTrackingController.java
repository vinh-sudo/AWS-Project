package be.backend.controller.manager;

import be.backend.model.response.DelayResponse;
import be.backend.model.response.GanttItemResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.GanttService;
import be.backend.service.manager.OeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}