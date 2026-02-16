package be.backend.service.utilities;

import be.backend.entity.Notification;
import be.backend.entity.User;
import be.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;
    private final TemplateEngine templateEngine;

    public void notifyFromTemplate(
            User user,
            String title,
            String templateName,
            Map<String, Object> data,
            String level,
            String sourceType,
            Integer sourceId,
            String url
    ) {
        Context ctx = new Context();
        ctx.setVariables(data);

        String html = templateEngine.process("notifications/" + templateName, ctx);

        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(html);
        n.setLevel(level);
        n.setSourceType(sourceType);
        n.setSourceId(sourceId);
        n.setUrl(url);
        n.setStatus("UNREAD");
        n.setCreatedAt(OffsetDateTime.now());

        repo.save(n);
    }
}
