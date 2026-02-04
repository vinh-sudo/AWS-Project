package be.backend.service;

import be.backend.entity.Account;
import be.backend.entity.User;
import be.backend.exception.BusinessException;
import be.backend.repository.AccountRepository;
import be.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    public void checkEmailExists(String email) {
        if(!userRepository.existsByEmail(email)) {
            throw new BusinessException("Email not found");
        }
    }

    public void updatePassword(String employeeCode, String newPassword) {
        Account account = accountRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new BusinessException("Account not found"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
    }
}
