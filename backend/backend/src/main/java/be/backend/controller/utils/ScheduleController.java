package be.backend.controller.utils;

import be.backend.entity.Account;
import be.backend.service.manager.SchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final SchedulerService schedulerService;

    // ================= START =================


    // ================= PAUSE =================
    @PostMapping("/{id}/pause")
    public ResponseEntity<?> pause(@PathVariable Integer id,
                                   @AuthenticationPrincipal Account account) {
        schedulerService.pauseSchedule(id, account);
        return ResponseEntity.ok().build();
    }

    // ================= RESUME =================
    @PostMapping("/{id}/resume")
    public ResponseEntity<?> resume(@PathVariable Integer id,
                                    @AuthenticationPrincipal Account account) {
        schedulerService.resumeSchedule(id, account);
        return ResponseEntity.ok().build();
    }

    // ================= FINISH =================

}
