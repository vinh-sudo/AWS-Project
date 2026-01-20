package be.backend.service;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import be.backend.entity.Account;
import be.backend.exception.BusinessException;
import be.backend.mapper.AccountMapper;
import be.backend.model.request.LoginRequest;
import be.backend.model.response.LoginResponse;
import be.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AccountMapper accountMapper;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;
/**
    @param request -Chứa employeeCode và password
    @return LoginResponse - Chứa token và thông tin user
*/
    public LoginResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmployeeCode(request.getEmployeeCode()).orElseThrow(() -> new BusinessException("Employee code not found"));
        if(!"active".equals(account.getStatus())){
            throw new BusinessException("Account is not active");
        }
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            log.warn("Failed login attempt for employee code: {}", request.getEmployeeCode());
            throw new BusinessException("Mã nhân viên hoặc mật khẩu không đúng");
        }
        String accessToken = jwtService.generateToken(account);
        String refreshToken = jwtService.generateRefreshToken(account);
        account.setLastLogin(OffsetDateTime.now());
        accountRepository.save(account);
        LoginResponse response = accountMapper.toLoginResponse(account);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtExpiration / 1000);

        log.info("Login successful for employee code: {}", request.getEmployeeCode());
        return response;
    }
}
