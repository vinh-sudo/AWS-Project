package be.backend.repository;

import be.backend.entity.Account;
import be.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

@Repository
public interface AccountRepository extends JpaRepository<Account,Integer> {

    @Query("SELECT a FROM Account a JOIN FETCH a.employee e WHERE e.employeeCode = :employeeCode")
    Optional<Account> findByEmployeeCode(String employeeCode);


    boolean existsByUsername(String username);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
           "FROM Account a JOIN a.employee e WHERE e.employeeCode = :employeeCode")
    boolean existsByEmployeeCode(String employeeCode);

    Optional<Account> findByUsername(String username);

    Optional<Account> findByRoleIgnoreCase(String role);

    @Query(value = "SELECT a FROM Account a" +
            " LEFT JOIN FETCH a.employee e" +
            " WHERE (:role IS NULL OR UPPER(a.role) = UPPER(:role))" +
            "   AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')))",
            countQuery = "SELECT COUNT(a) FROM Account a" +
            " WHERE (:role IS NULL OR UPPER(a.role) = UPPER(:role))" +
            "   AND (:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Account> findAllWithFilters(@Param("role") String role,
                                      @Param("search") String search,
                                      Pageable pageable);
}

