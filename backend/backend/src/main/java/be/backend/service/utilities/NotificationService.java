package be.backend.service.utilities;


import be.backend.entity.Notification;
import be.backend.entity.User;
import be.backend.repository.NotificationRepository;
import be.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public void notifyUser(
            User user,
            String title,
            String message,
            String level,
            String sourceType,
            Integer sourceId,
            String url
    ) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setStatus("UNREAD");
        n.setLevel(level);
        n.setSourceType(sourceType);
        n.setSourceId(sourceId);
        n.setUrl(url);
        n.setCreatedAt(OffsetDateTime.now());

        notificationRepo.save(n);
    }

    public void notifyRole(
            String role,
            String title,
            String message,
            String level,
            String sourceType,
            Integer sourceId,
            String url
    ) {
        List<User> users = userRepo.findByRole(role);
        for (User u : users) {
            notifyUser(u, title, message, level, sourceType, sourceId, url);
        }
    }
}
