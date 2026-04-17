package be.backend.controller.utils;

import be.backend.entity.Notification;
import be.backend.model.dto.NotificationDTO;
import be.backend.service.utilities.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationQueryService notificationQueryService;

    // ===============================
    // 1. Load my notifications (paging)
    // ===============================
    @GetMapping
    public Page<NotificationDTO> getMyNotifications(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<Notification> notifications = notificationQueryService.getMyNotifications(userId, page, size);
        return new PageImpl<>(
                notifications.getContent().stream()
                        .map(NotificationDTO::fromEntity)
                        .collect(Collectors.toList()),
                notifications.getPageable(),
                notifications.getTotalElements()
        );
    }

    // ===============================
    // 2. Unread badge
    // ===============================
    @GetMapping("/unread-count")
    public long getUnreadCount(@RequestParam Integer userId) {
        return notificationQueryService.countUnread(userId);
    }

    // ===============================
    // 3. Mark one as read
    // ===============================
    @PostMapping("/{id}/read")
    public void markAsRead(
            @PathVariable Integer id,
            @RequestParam Integer userId
    ) {
        notificationQueryService.markAsRead(id, userId);
    }

    // ===============================
    // 4. Mark all as read
    // ===============================
    @PostMapping("/read-all")
    public void markAllAsRead(@RequestParam Integer userId) {
        notificationQueryService.markAllAsRead(userId);
    }

    // ===============================
    // 5. Filter by source type (PLAN, ORDER…)
    // ===============================
    @GetMapping("/filter")
    public Page<NotificationDTO> filterByType(
            @RequestParam Integer userId,
            @RequestParam String sourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<Notification> notifications = notificationQueryService.filterByType(userId, sourceType, page, size);
        return new PageImpl<>(
                notifications.getContent().stream()
                        .map(NotificationDTO::fromEntity)
                        .collect(Collectors.toList()),
                notifications.getPageable(),
                notifications.getTotalElements()
        );
    }
}
