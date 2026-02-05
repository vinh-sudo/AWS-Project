package be.backend.repository;

import be.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserIdOrderByTimestampDesc(Integer userId);
    
    List<AuditLog> findByActionTypeOrderByTimestampDesc(String actionType);
    
    List<AuditLog> findByEntityOrderByTimestampDesc(String entity);
    
    List<AuditLog> findAllByOrderByTimestampDesc();
}
