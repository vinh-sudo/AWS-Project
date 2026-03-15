package be.backend.service.utilities;

import be.backend.entity.AuditLog;
import be.backend.entity.AuditLogArchive;
import be.backend.repository.AuditLogArchiveRepository;
import be.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * AuditArchivalService - Auto archive old logs
 * 
 * Nguyên lý:
 * - Scheduled Job: Chạy định kỳ (monthly)
 * - Hot/Cold Storage: Keep 3 months hot, archive older
 * - Batch Processing: Move từng batch → Không lock DB lâu
 * - Retention Policy: Auto cleanup theo category
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditArchivalService {
    
    private final AuditLogRepository auditLogRepository;
    private final AuditLogArchiveRepository auditLogArchiveRepository;
    
    /**
     * Chạy mỗi tháng vào 1st day, 2AM
     * Cron: "0 0 2 1 * ?" = Second Minute Hour Day Month DayOfWeek
     */
    @Scheduled(cron = "0 0 2 1 * ?")
    public void archiveOldLogs() {
        log.info("Starting audit log archival job");
        
        OffsetDateTime cutoffDate = OffsetDateTime.now().minusDays(90);  // 3 months
        
        long totalCount = auditLogRepository.countByTimestampBefore(cutoffDate);
        log.info("Found {} logs to archive (older than {})", totalCount, cutoffDate);
        
        if (totalCount == 0) {
            log.info("No logs to archive");
            return;
        }
        
        // Batch process: 1000 logs/batch
        int batchSize = 1000;
        int totalProcessed = 0;
        
        while (true) {
            List<AuditLog> batch = auditLogRepository
                .findByTimestampBeforeOrderByTimestampAsc(
                    cutoffDate,
                    PageRequest.of(0, batchSize)
                );
            
            if (batch.isEmpty()) {
                break;
            }

            List<AuditLogArchive> archiveBatch = batch.stream()
                    .map(this::toArchive)
                    .toList();
            auditLogArchiveRepository.saveAll(archiveBatch);
            
            // Delete from hot table
            deleteBatch(batch);
            
            totalProcessed += batch.size();
            log.info("Archived {} logs (total: {})", batch.size(), totalProcessed);
            
            // Sleep để không overwhelm DB
            try {
                Thread.sleep(1000);  // 1 second between batches
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        log.info("Archival job completed. Total processed: {}", totalProcessed);
    }
    
    @Transactional
    protected void deleteBatch(List<AuditLog> logs) {
        auditLogRepository.deleteAllInBatch(logs);
    }

    private AuditLogArchive toArchive(AuditLog log) {
        return AuditLogArchive.builder()
                .userId(log.getUser().getId())
                .actionType(log.getActionType())
                .entity(log.getEntity())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .archivedAt(OffsetDateTime.now())
                .build();
    }
}