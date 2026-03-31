package be.backend.repository;

import be.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

    @Query("SELECT a FROM Account a JOIN FETCH a.employee e WHERE e.employeeCode = :employeeCode")
    Optional<Account> findByEmployeeCode(String employeeCode);

    boolean existsByUsername(String username);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Account a JOIN a.employee e WHERE e.employeeCode = :employeeCode")
    boolean existsByEmployeeCode(String employeeCode);

    Optional<Account> findByUsername(String username);

    // Sửa lại trả về List<Account> thay vì Optional<Account> để tránh lỗi NonUniqueResultException
    List<Account> findByRoleIgnoreCase(String role);


    @Query(value = "SELECT a.* FROM accounts a" +
            " LEFT JOIN employee e ON e.employee_id = a.employee_id" +
            " WHERE (:role IS NULL OR UPPER(a.role::text) = UPPER(:role))" +
            "   AND (:search IS NULL OR LOWER(a.username::text) LIKE LOWER('%' || :search || '%'))" +
            " ORDER BY a.created_at DESC",
            countQuery = "SELECT COUNT(*) FROM accounts a" +
            " WHERE (:role IS NULL OR UPPER(a.role::text) = UPPER(:role))" +
            "   AND (:search IS NULL OR LOWER(a.username::text) LIKE LOWER('%' || :search || '%'))",
            nativeQuery = true)

    Page<Account> findAllWithFilters(@Param("role") String role,
            @Param("search") String search,
            Pageable pageable);

    // Lấy tất cả account LINE_LEADER chưa gắn line nào (status ACTIVE)
    @Query("SELECT a FROM Account a" +
            " JOIN FETCH a.employee e" +
            " WHERE a.role = 'LINE_LEADER'" +
            "   AND a.status = 'active'" +
            "   AND e.id NOT IN (" +
            "       SELECT la.leader.id FROM LineLeaderAssignment la" +
            "       WHERE la.status = 'ACTIVE')")
    List<Account> findAvailableLineLeaders();
}
