package be.backend.controller.manager;

import be.backend.model.response.LineOverviewResponse;
import be.backend.service.manager.ManagerLineOverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager/lines")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class ManagerLineController {

    private final ManagerLineOverviewService service;

    @GetMapping("/overview")
    public List<LineOverviewResponse> overview() {
        return service.getOverview();
    }
}
