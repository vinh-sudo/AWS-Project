package be.backend.service.admin;

import java.time.OffsetDateTime;
import be.backend.enums.Role;
import be.backend.enums.EmployeeType;
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
import be.backend.service.utilities.EmployeeCodeGeneratorService;
import be.backend.service.utilities.JwtService;
import be.backend.service.utilities.TokenBlacklistService;
import be.backend.service.utilities.ValidationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    // MinhCoffee
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
     * @param request contains employeeCode and password
     * @return LoginResponse containing the token and user information
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Account account;
        String identifier = request.getEmployeeCode();

        // Try employeeCode first (worker/manager)
        var byEmployeeCode = accountRepository.findByEmployeeCode(identifier);

        if (byEmployeeCode.isPresent()) {
            account = byEmployeeCode.get();
        } else {
            // If employeeCode is not found, try username (admin)
            account = accountRepository.findByUsername(identifier)
                    .orElseThrow(() -> new BusinessException("Account does not exist"));

            // Only admins can log in with username
            if (!Role.ADMIN.name().equals(account.getRole())) {
                throw new BusinessException("Employee code does not exist");
            }
        }

        if (!"active".equals(account.getStatus())) {

            throw new BusinessException("Account is not active");
        }

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            log.warn("Failed login attempt for: {}", identifier);

            throw new BusinessException("Employee code or password is incorrect");

        }

        String accessToken = jwtService.generateToken(account);
        String refreshToken = jwtService.generateRefreshToken(account);
        account.setLastLogin(OffsetDateTime.now());
        accountRepository.save(account);

        LoginResponse response = accountMapper.toLoginResponse(account);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtExpiration / 1000);

        log.info("Login successful for: {} (role: {})", identifier, account.getRole());
        return response;
    }

    /**
     * @param request registration details
     * @return RegisterResponse
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Starting registration for username: {}", request.getUsername());
        // 1. Validation
        Role role = Role.fromString(request.getRole()); // Validate and parse
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

        // 3. Create employee
        Employee employee = null;
        String employeeCode = request.getEmployeeCode();

        if (role.requiresEmployee()) {
            if (employeeCode == null || employeeCode.isBlank()) {
                employeeCode = employeeCodeGenerator.generateEmployeeCode();
            } else {
                validationService.validateEmployeeCodeNotExists(employeeCode);
            }

            employee = new Employee();
            employee.setUser(savedUser);
            employee.setEmployeeCode(employeeCode);
            employee.setPosition(request.getPosition());
            employee.setEmployeeType(EmployeeType.fromRole(role).name());
            employee.setStatus("active");

            employee = employeeRepository.save(employee);
            log.info("Employee created with code: {}", employeeCode);
        }

        // 4. Create account
        Account account = new Account();
        account.setUser(savedUser);
        account.setEmployee(employee);
        account.setUsername(request.getUsername());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setRole(role.name());
        account.setStatus("active");
        account.setCreatedAt(OffsetDateTime.now());
        account.setUpdatedAt(OffsetDateTime.now());

        Account savedAccount = accountRepository.save(account);
        log.info("Account created with ID: {}", savedAccount.getId());

        // 5. Build response
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
     * Logout user - Blacklist current token
     * 
        * @param token JWT token from request header
     * @return LogoutResponse
     */
    @Transactional
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
}
