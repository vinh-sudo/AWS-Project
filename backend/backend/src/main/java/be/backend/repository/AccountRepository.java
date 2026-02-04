package be.backend.repository;

import be.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account,Long> {
    Optional<Account> findByUsername(String username);
    
    @Query("SELECT a FROM Account a WHERE a.employee.employeeCode = :employeeCode")
    Optional<Account> findByEmployeeCode(@Param("employeeCode") String employeeCode);
    
    @Query("SELECT COUNT(a) > 0 FROM Account a WHERE a.employee.employeeCode = :employeeCode")
    boolean existsByEmployeeCode(@Param("employeeCode") String employeeCode);
    
    boolean existsByUsername(String username);
}
