package be.backend.repository;

import be.backend.entity.AuditLogArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogArchiveRepository extends JpaRepository<AuditLogArchive, Integer> {
}
