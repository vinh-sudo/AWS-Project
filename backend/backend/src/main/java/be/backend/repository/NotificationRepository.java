package be.backend.repository;

import be.backend.entity.Notification;
import be.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
}
