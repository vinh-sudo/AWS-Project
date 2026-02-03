package be.backend.repository;

import be.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Query("""
    select r
    from Report r
    where r.line.id in :lineIds
    and r.workDate = :date
""")
    List<Report> findAllByLineIdsAndDate(
            List<Integer> lineIds,
            LocalDate date
    );

}
