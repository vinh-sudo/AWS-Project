package be.backend.service.ai;

import be.backend.configuration.AiRuntimeProperties;
import be.backend.model.ai.AiContextSnapshot;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.OeeService;
import be.backend.service.statistics.ManagerStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.locks.ReentrantLock;

@Service
@RequiredArgsConstructor
public class AiContextService {

    private final DelayService delayService;
    private final OeeService oeeService;
    private final ManagerStatisticsService statisticsService;
    private final AiRuntimeProperties runtimeProperties;

    private volatile AiContextSnapshot cachedSnapshot;
    private volatile long cachedAtMs;
    private final ReentrantLock refreshLock = new ReentrantLock();

    public AiContextSnapshot getCurrentSnapshot() {
        long now = System.currentTimeMillis();
        long ttlMs = Math.max(5, runtimeProperties.getContextCacheSeconds()) * 1000L;

        if (cachedSnapshot != null && (now - cachedAtMs) < ttlMs) {
            return cachedSnapshot;
        }

        refreshLock.lock();
        try {
            now = System.currentTimeMillis();
            if (cachedSnapshot != null && (now - cachedAtMs) < ttlMs) {
                return cachedSnapshot;
            }

            AiContextSnapshot fresh = AiContextSnapshot.builder()
                .snapshotTime(LocalDateTime.now())
                .productionOverview(statisticsService.getTodayStatistics())
                .delays(delayService.getTodayDelay())
                .oeeByLine(oeeService.getTodayOee())
                .build();

            cachedSnapshot = fresh;
            cachedAtMs = now;
            return fresh;
        } finally {
            refreshLock.unlock();
        }
    }
}
