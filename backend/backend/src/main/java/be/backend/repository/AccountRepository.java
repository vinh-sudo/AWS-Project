package be.backend.repository;

import be.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account,Integer> {
   
    @Query("SELECT a FROM Account a JOIN FETCH a.employee e WHERE e.employeeCode = :employeeCode")
    Optional<Account> findByEmployeeCode(String employeeCode);
    
   
    boolean existsByUsername(String username);
    
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
           "FROM Account a JOIN a.employee e WHERE e.employeeCode = :employeeCode")
    boolean existsByEmployeeCode(String employeeCode);

    Optional<Account> findByUsername(String username);
}
