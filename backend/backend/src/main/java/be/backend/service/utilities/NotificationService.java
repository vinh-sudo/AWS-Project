package be.backend.service.utilities;

import be.backend.entity.Notification;
import be.backend.entity.User;
import be.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    /**
     * Create a notification using existing schema (no extra fields).
     * Frontend can distinguish notifications by title, level, sourceType, etc.
     */
    public void notifyStructured(
            User user,
            String title,
            String message, // add message parameter
            Map<String, Object> payload,
            String level,
            String sourceType,
            Integer sourceId,
            String url
    ) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        // If message is null, fall back to the title
        n.setMessage(message != null ? message : title);
        n.setLevel(level);
        n.setSourceType(sourceType);
        n.setSourceId(sourceId);
        n.setUrl(url);
        n.setStatus("UNREAD");
        n.setCreatedAt(OffsetDateTime.now());

        repo.save(n);
    }
}
