package be.backend.repository;

import be.backend.entity.Account;
import be.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account,Integer> {
    Optional<Account> findByUsername(String username);
    Optional<Account> findByEmployeeCode(String employeeCode);
    Optional<Account> findByUser(User user);
}
