package be.backend.service.admin;

import be.backend.entity.Employee;
import be.backend.repository.EmployeeRepository;
import be.backend.service.utilities.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;
    private final EmployeeRepository employeeRepository;

    private static final int EXPIRE_MIN = 5;

    public void generateOtpByEmployeeCode(String employeeCode) {

        Employee emp = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String email = emp.getUser().getEmail();
        String key = "OTP:" + employeeCode;

        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            throw new RuntimeException("OTP already sent. Please wait.");
        }

        String otp = String.valueOf(new Random().nextInt(899999) + 100000);
        redisTemplate.opsForValue().set(key, otp, EXPIRE_MIN, TimeUnit.MINUTES);

        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyOtp(String employeeCode, String otp) {
        String key = "OTP:" + employeeCode;
        String value = redisTemplate.opsForValue().get(key);

        if (value != null && value.equals(otp)) {
            redisTemplate.delete(key);
            return true;
        }
        return false;
    }

    public void resendOtp(String employeeCode) {
        redisTemplate.delete("OTP:" + employeeCode);
        generateOtpByEmployeeCode(employeeCode);
    }
}

