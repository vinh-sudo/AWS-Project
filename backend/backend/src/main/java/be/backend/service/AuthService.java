package be.backend.service;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import be.backend.entity.Account;
import be.backend.entity.Employee;
import be.backend.entity.User;
import be.backend.exception.BusinessException;
import be.backend.mapper.AccountMapper;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.LoginResponse;
import be.backend.model.response.LogoutResponse;
import be.backend.model.response.RegisterResponse;
import be.backend.repository.AccountRepository;
import be.backend.repository.EmployeeRepository;
import be.backend.repository.UserRepository;
import ch.qos.logback.core.subst.Token;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
//MinhCoffee
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository; 
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AccountMapper accountMapper;
    private final ValidationService validationService;
    private final EmployeeCodeGeneratorService employeeCodeGenerator;
    private final TokenBlacklistService tokenBlacklistService;   
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
/**
    @param request -Chứa employeeCode và password
    @return LoginResponse - Chứa token và thông tin user
*/
    @Transactional
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

    /**
     * @param request - Thông tin đăng ký
     * @return RegisterResponse  
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Starting registration for username: {}", request.getUsername());
         // 1. VALIDATION
        validationService.validateEmailNotExists(request.getEmail());
        validationService.validateUsernameNotExists(request.getUsername());
        

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setStatus("active");
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());
        
        User savedUser = userRepository.save(user);
        log.info("User created with ID: {}", savedUser.getId());
        
        // 3. TẠO EMPLOYEE (nếu cần)
        Employee employee = null;
        String employeeCode = request.getEmployeeCode();
       if (requiresEmployeeRecord(request.getRole())) {
            if (employeeCode == null || employeeCode.isBlank()) {
                employeeCode = employeeCodeGenerator.generateEmployeeCode();
            } else {
                validationService.validateEmployeeCodeNotExists(employeeCode);
            }
            
            employee = new Employee();
            employee.setUser(savedUser);
            employee.setEmployeeCode(employeeCode);
            employee.setPosition(request.getPosition());
            employee.setEmployeeType(mapRoleToEmployeeType(request.getRole()));  // THÊM DÒNG NÀY
            employee.setStatus("active");
            
            employee = employeeRepository.save(employee);
            log.info("Employee created with code: {}", employeeCode);
        }
        
        // 4. TẠO ACCOUNT
        Account account = new Account();
        account.setUser(savedUser);
        account.setEmployee(employee);
        account.setUsername(request.getUsername());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setRole(request.getRole());
        account.setStatus("active");
        account.setCreatedAt(OffsetDateTime.now());
        account.setUpdatedAt(OffsetDateTime.now());
        
        Account savedAccount = accountRepository.save(account);
        log.info("Account created with ID: {}", savedAccount.getId());
        
        // 5. TẠO RESPONSE
        return RegisterResponse.builder()
                .userId(savedUser.getId())
                .accountId(savedAccount.getId())
                .username(savedAccount.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFirstName() + " " + savedUser.getLastName())
                .employeeCode(employeeCode)
                .role(savedAccount.getRole())
                .status(savedAccount.getStatus())
                .createdAt(savedAccount.getCreatedAt())
                .message("Registration successful")
                .build();
    }
    
    /**
     * Kiểm tra role có cần Employee record không
     */
    private boolean requiresEmployeeRecord(String role) {
        return !role.equalsIgnoreCase("admin");  // Admin không cần employee code    
    }

    // 2. Thêm method logout
/**
 * Logout user - Blacklist current token
 * @param token - JWT token từ request header
 * @return LogoutResponse
 */
   public LogoutResponse logout(String accessToken, String refreshToken) {
    if (accessToken == null || accessToken.isBlank()) {
        throw new BusinessException("Access token is required");
    }
    
    // Blacklist access token
    long accessExpiration = jwtService.getExpirationInSeconds(accessToken);
    if (accessExpiration > 0) {
        tokenBlacklistService.blacklistToken(accessToken, accessExpiration);
    }
    
    // Blacklist refresh token
    if (refreshToken != null && !refreshToken.isBlank()) {
        long refreshExpiration = jwtService.getExpirationInSeconds(refreshToken);
        if (refreshExpiration > 0) {
            tokenBlacklistService.blacklistToken(refreshToken, refreshExpiration);
        }
    }
    
    String username = jwtService.extractUsername(accessToken);
    log.info("User {} logged out successfully", username);
    
    return LogoutResponse.builder()
            .message("Logout successful")
            .logoutAt(OffsetDateTime.now())
            .success(true)
            .build();
}
    
  private String mapRoleToEmployeeType(String role) {
        return switch (role.toLowerCase()) {
            case "manager" -> "MANAGER";
            case "admin" -> "ADMIN";
            default -> "WORKER";
        };
    }
}

