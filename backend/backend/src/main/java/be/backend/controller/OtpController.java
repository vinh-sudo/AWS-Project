package be.backend.controller;

import be.backend.model.request.PasswordResetRequest;
import be.backend.service.OtpService;
import be.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/otp/")
@RequiredArgsConstructor
public class OtpController {
    private final OtpService otpService;

    private final UserService userService;

    @PostMapping("/forgot/request")
    public ResponseEntity<?> requestPasswordOtp(@RequestParam String email) {
        userService.checkEmailExists(email);
        otpService.generateOtp(email);
        return ResponseEntity.ok("OTP for password reset sent to " + email);
    }

    @PostMapping("/forgot/verify")
    public ResponseEntity<?> verifyPasswordOtp(@RequestBody PasswordResetRequest request) {

        boolean valid = otpService.verifyOtp(
                request.getEmail(),
                request.getOtp()
        );

        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        userService.updatePassword(
                request.getEmail(),
                request.getNewPassword()
        );

        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/resend")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        otpService.resendOtp(email);
        return ResponseEntity.ok("OTP resent to " + email);
    }
}
