package be.backend.configuration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;
import java.util.UUID;

@Component
@Slf4j
public class AiAuditLogInterceptor implements HandlerInterceptor {

    private static final String ATTR_START_TIME = "ai.audit.start";
    private static final String ATTR_REQUEST_ID = "ai.audit.requestId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(ATTR_START_TIME, System.currentTimeMillis());
        String requestId = Optional.ofNullable(request.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
        request.setAttribute(ATTR_REQUEST_ID, requestId);
        response.setHeader("X-Request-Id", requestId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        long start = Optional.ofNullable((Long) request.getAttribute(ATTR_START_TIME)).orElse(System.currentTimeMillis());
        long durationMs = System.currentTimeMillis() - start;
        String requestId = (String) request.getAttribute(ATTR_REQUEST_ID);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String user = auth != null ? auth.getName() : "anonymous";
        String roles = auth != null ? auth.getAuthorities().toString() : "[]";
        String path = request.getRequestURI();
        String method = request.getMethod();
        int status = response.getStatus();
        String clientIp = request.getRemoteAddr();

        if (ex == null) {
            log.info("AI_AUDIT requestId={} user={} roles={} method={} path={} status={} durationMs={} clientIp={}",
                requestId, user, roles, method, path, status, durationMs, clientIp);
        } else {
            log.warn("AI_AUDIT requestId={} user={} roles={} method={} path={} status={} durationMs={} clientIp={} error={}",
                requestId, user, roles, method, path, status, durationMs, clientIp, ex.getClass().getSimpleName());
        }
    }
}
