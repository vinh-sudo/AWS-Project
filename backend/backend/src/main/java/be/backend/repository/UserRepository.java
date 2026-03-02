package be.backend.repository;

import be.backend.entity.User;


import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User,Integer> {
    boolean existsByEmail(String email);
    long countByStatus(String status);
}
