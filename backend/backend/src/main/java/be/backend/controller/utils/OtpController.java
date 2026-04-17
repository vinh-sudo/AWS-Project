package be.backend.controller.utils;

import be.backend.model.request.PasswordResetRequest;
import be.backend.service.admin.OtpService;
import be.backend.service.admin.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final UserService userService;

    // 1. Enter employeeCode -> send OTP to email
    @PostMapping("/forgot/request")
    public ResponseEntity<?> requestPasswordOtp(@RequestBody PasswordResetRequest request) {
        otpService.generateOtpByEmployeeCode(request.getEmployeeCode());
        return ResponseEntity.ok("OTP sent to employee email");
    }

    // 2. Enter OTP screen: check OTP only (do not consume)
    @PostMapping("/forgot/check")
    public ResponseEntity<?> checkPasswordOtp(@RequestBody PasswordResetRequest request) {
        boolean valid = otpService.checkOtpOnly(
                request.getEmployeeCode(),
                request.getOtp()
        );

        return ResponseEntity.ok(Map.of("valid", valid));
    }

    // 3. Final submit: OTP + new password
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
    public ResponseEntity<?> resendOtp(@RequestBody PasswordResetRequest request) {
        otpService.resendOtp(request.getEmployeeCode());
        return ResponseEntity.ok("OTP resent");
    }
}

