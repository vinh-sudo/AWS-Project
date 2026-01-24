package be.backend.controller;

import be.backend.model.request.PasswordResetRequest;
import be.backend.service.OtpService;
import be.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final UserService userService;

    // 1. Nhập employeeCode → gửi OTP về email
    @PostMapping("/forgot/request")
    public ResponseEntity<?> requestPasswordOtp(@RequestParam String employeeCode) {
        otpService.generateOtpByEmployeeCode(employeeCode);
        return ResponseEntity.ok("OTP sent to employee email");
    }

    // 2. Nhập OTP + mật khẩu mới
    @PostMapping("/forgot/verify")
    public ResponseEntity<?> verifyPasswordOtp(@RequestBody PasswordResetRequest request) {

        boolean valid = otpService.verifyOtp(
                request.getEmployeeCode(),
                request.getOtp()
        );

        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        userService.updatePassword(
                request.getEmployeeCode(),
                request.getNewPassword()
        );

        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/resend")
    public ResponseEntity<?> resendOtp(@RequestParam String employeeCode) {
        otpService.resendOtp(employeeCode);
        return ResponseEntity.ok("OTP resent");
    }
}

