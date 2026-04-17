package be.backend.controller.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import be.backend.exception.BusinessException;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.LogoutRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.LoginResponse;
import be.backend.model.response.LogoutResponse;
import be.backend.model.response.RegisterResponse;
import be.backend.service.admin.AuthService;

import org.springframework.web.bind.annotation.RequestBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // @RequestBody: parse JSON from the request body into a LoginRequest object
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(
        HttpServletRequest request,
        @RequestBody(required = false) LogoutRequest logoutRequest) {
    
    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        throw new BusinessException("No token provided");
    }
    String accessToken = authHeader.substring(7);
    String refreshToken = logoutRequest != null ? logoutRequest.getRefreshToken() : null;

    LogoutResponse response = authService.logout(accessToken, refreshToken);
    return ResponseEntity.ok(response);
}

   
}
