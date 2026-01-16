package be.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import be.backend.model.request.LoginRequest;
import be.backend.model.response.LoginResponse;
import be.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    // public LoginResponse login(LoginRequest request) {
    //     // Account account = accountRepository.findByEmployeeCode(request.getEmployeeCode())
    // }
}
