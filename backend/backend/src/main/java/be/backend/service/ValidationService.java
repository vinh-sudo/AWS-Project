package be.backend.service;

import org.springframework.stereotype.Service;


import be.backend.exception.BusinessException;
import be.backend.repository.AccountRepository;
import be.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ValidationService {
    private final UserRepository userRepository ;
    private final AccountRepository accountRepository;

    public void validateEmailNotExists(String email){
        if(userRepository.existsByEmail(email)){
            throw new IllegalArgumentException("Email already exists");
        }
    }
    
    public void validateUsernameNotExists(String username) {
        if (accountRepository.existsByUsername(username)) {
            throw new BusinessException("Username already exists");
        }
    }
    

     public void validateEmployeeCodeNotExists(String employeeCode) {
        if (accountRepository.existsByEmployeeCode(employeeCode)) {
            throw new BusinessException("Employee code already exists");
        }
    }

}
