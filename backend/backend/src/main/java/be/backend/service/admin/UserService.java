package be.backend.service.admin;

import be.backend.entity.Account;
import be.backend.event.AccountEvent;
import be.backend.exception.BusinessException;
import be.backend.repository.AccountRepository;
import be.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final ApplicationEventPublisher eventPublisher;

    public void checkEmailExists(String email) {
        if(!userRepository.existsByEmail(email)) {
            throw new BusinessException("Email not found");
        }
    }

    // Giả sử có hàm tạo account (addUser hoặc createUser)
    public void createUser(Account account) {
        accountRepository.save(account);
        // Publish event
        eventPublisher.publishEvent(new AccountEvent.UserCreatedEvent(account.getUser()));
    }

    public void updatePassword(String employeeCode, String newPassword) {
        Account account = accountRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new BusinessException("Account not found"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        // Publish event
        eventPublisher.publishEvent(new AccountEvent.PasswordResetEvent(account.getUser()));
    }
}
