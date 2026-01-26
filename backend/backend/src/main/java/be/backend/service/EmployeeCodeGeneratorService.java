package be.backend.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Random;

import org.springframework.stereotype.Service;

import be.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeCodeGeneratorService {
//MinhCoffee
    private final AccountRepository accountRepository;

    public String generateEmployeeCode(){
        String prefix = "EMP";
        String code;
         do {
            String randomNum = String.format("%04d", new Random().nextInt(10000));
            code = prefix + randomNum;
        } while (accountRepository.existsByEmployeeCode(code));       
        return code;
    }
    
}
