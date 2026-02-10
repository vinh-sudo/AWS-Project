package be.backend.repository;

import be.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    long countByUserIdAndStatus(Integer userId, String status);

    Page<Notification> findByUserIdAndSourceTypeOrderByCreatedAtDesc(
            Integer userId,
            String sourceType,
            Pageable pageable
    );

    @Modifying
    @Transactional
    @Query("""
        update Notification n
        set n.status = 'READ'
        where n.id = :notificationId
        and n.user.id = :userId
    """)
    int markAsRead(
            @Param("notificationId") Integer notificationId,
            @Param("userId") Integer userId
    );

    @Modifying
    @Transactional
    @Query("""
        update Notification n
        set n.status = 'READ'
        where n.user.id = :userId
        and n.status = 'UNREAD'
    """)
    int markAllAsRead(@Param("userId") Integer userId);
}
