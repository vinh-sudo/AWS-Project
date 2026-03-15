package be.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;


/**
 * Spring Boot Application
 * 
 * @EnableScheduling - Enable scheduled jobs (AuditArchivalService)
 * @EnableAsync - Enable async methods (auditLogService.logAsync())
 */
@SpringBootApplication
@EnableScheduling 
@EnableAsync
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
