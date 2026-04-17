package be.backend.service.admin;

import be.backend.entity.Employee;
import be.backend.exception.ResourceNotFoundException;
import be.backend.repository.EmployeeRepository;
import be.backend.service.utilities.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;
    private final EmployeeRepository employeeRepository;

    private static final int EXPIRE_MIN = 5;

    public void generateOtpByEmployeeCode(String employeeCode) {
        String key = "OTP:" + employeeCode;
        String otp = String.format("%06d", new Random().nextInt(999999));
        try {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.delete(key);
            }
            redisTemplate.opsForValue().set(key, otp, EXPIRE_MIN, TimeUnit.MINUTES);
        } catch (Exception e) {
            // Nếu Redis lỗi, vẫn gửi OTP qua email nhưng không lưu vào Redis
            // => OTP sẽ không kiểm tra được
            log.warn("[Redis] Failed to store OTP for {}: {}", employeeCode, e.getMessage());
        }

        Employee emp = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        String email = emp.getUser().getEmail();

        emailService.sendOtpEmail(email, otp);
    }

    public boolean checkOtpOnly(String employeeCode, String otp) {
        String key = "OTP:" + employeeCode;
        try {
            String value = redisTemplate.opsForValue().get(key);
            return value != null && value.equals(otp);
        } catch (Exception e) {
            log.warn("[Redis] Failed to check OTP for {}: {}", employeeCode, e.getMessage());
            return false;
        }
    }

    public boolean verifyOtp(String employeeCode, String otp) {
        boolean valid = checkOtpOnly(employeeCode, otp);
        if (!valid) {
            return false;
        }

        String key = "OTP:" + employeeCode;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("[Redis] Failed to delete OTP for {} after verification: {}", employeeCode, e.getMessage());
        }
        return true;
    }

    public void resendOtp(String employeeCode) {
        try {
            redisTemplate.delete("OTP:" + employeeCode);
        } catch (Exception e) {
            log.warn("[Redis] Failed to delete OTP for {}: {}", employeeCode, e.getMessage());
        }
        generateOtpByEmployeeCode(employeeCode);
    }
}
