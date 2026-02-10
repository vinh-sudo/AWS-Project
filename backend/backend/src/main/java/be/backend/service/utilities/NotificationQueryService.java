package be.backend.service.utilities;

import be.backend.entity.Notification;
import be.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private final NotificationRepository repo;

    public Page<Notification> getMyNotifications(Integer userId, int page, int size) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    public long countUnread(Integer userId) {
        return repo.countByUserIdAndStatus(userId, "UNREAD");
    }

    public void markAsRead(Integer notificationId, Integer userId) {
        int updated = repo.markAsRead(notificationId, userId);
        if (updated == 0) {
            throw new RuntimeException("Notification not found or forbidden");
        }
    }

    public void markAllAsRead(Integer userId) {
        repo.markAllAsRead(userId);
    }

    public Page<Notification> filterByType(Integer userId, String sourceType, int page, int size) {
        return repo.findByUserIdAndSourceTypeOrderByCreatedAtDesc(
                userId,
                sourceType,
                PageRequest.of(page, size)
        );
    }
}
