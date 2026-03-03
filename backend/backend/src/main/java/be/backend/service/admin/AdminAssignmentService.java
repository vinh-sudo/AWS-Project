package be.backend.service.admin;

import be.backend.entity.Account;
import be.backend.entity.Employee;
import be.backend.entity.LineLeaderAssignment;
import be.backend.entity.ProductionLine;
import be.backend.exception.BusinessException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.request.AssignLeaderRequest;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.model.response.AssignmentResponse;
import be.backend.repository.AccountRepository;
import be.backend.repository.EmployeeRepository;
import be.backend.repository.LineLeaderAssignmentRepository;
import be.backend.repository.ProductionLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAssignmentService {

    private final LineLeaderAssignmentRepository assignmentRepo;
    private final ProductionLineRepository lineRepo;
    private final EmployeeRepository employeeRepo;
    private final AccountRepository accountRepo;

    // ======================== LIST ========================

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getActiveAssignments() {
        return assignmentRepo.findAllActive()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ======================== AVAILABLE LEADERS ========================

    @Transactional(readOnly = true)
    public List<AccountSummaryResponse> getAvailableLeaders() {
        return accountRepo.findAvailableLineLeaders()
                .stream()
                .map(a -> AccountSummaryResponse.builder()
                        .id(a.getId())
                        .username(a.getUsername())
                        .employeeCode(a.getEmployee().getEmployeeCode())
                        .role(a.getRole())
                        .status(a.getStatus())
                        .lastLogin(a.getLastLogin())
                        .build())
                .toList();
    }

    // ======================== ASSIGN ========================

    @Transactional
    public AssignmentResponse assignLeader(AssignLeaderRequest request) {
        // ① Kiểm tra line tồn tại
        ProductionLine line = lineRepo.findById(Long.valueOf(request.getLineId()))
                .orElseThrow(() -> new ResourceNotFoundException("ProductionLine", request.getLineId().toString()));

        // ② Kiểm tra employee tồn tại + là LINE_LEADER
        Employee leader = employeeRepo.findById(request.getLeaderId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getLeaderId().toString()));

        Account leaderAccount = leader.getAccount();
        if (leaderAccount == null || !"LINE_LEADER".equalsIgnoreCase(leaderAccount.getRole())) {
            throw new BusinessException("Employee " + leader.getEmployeeCode() + " is not a LINE_LEADER");
        }

        // ③ GUARD: Line đã có leader ACTIVE → phải unassign trước
        if (assignmentRepo.existsActiveByLineId(request.getLineId())) {
            throw new BusinessException("Line already has an active leader. Unassign first.");
        }

        // ④ GUARD: Leader đã gắn line khác → 1 leader chỉ 1 line
        if (assignmentRepo.existsActiveByLeaderId(request.getLeaderId())) {
            throw new BusinessException("Leader is already assigned to another line");
        }

        // ⑤ Tạo assignment
        LineLeaderAssignment assignment = new LineLeaderAssignment();
        assignment.setLine(line);
        assignment.setLeader(leader);
        assignment.setStatus("ACTIVE");
        assignment.setStartDate(OffsetDateTime.now());
        assignment.setCreatedAt(OffsetDateTime.now());

        return toResponse(assignmentRepo.save(assignment));
    }

    // ======================== UNASSIGN ========================

    @Transactional
    public AssignmentResponse unassignLeader(Long assignmentId) {
        LineLeaderAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId.toString()));

        if (!"ACTIVE".equalsIgnoreCase(assignment.getStatus())) {
            throw new BusinessException("Assignment is already ended");
        }

        // ⑥ Soft-end: set endDate + đổi status, KHÔNG xóa record
        assignment.setStatus("ENDED");
        assignment.setEndDate(OffsetDateTime.now());

        return toResponse(assignmentRepo.save(assignment));
    }

    // ======================== MAPPING ========================

    private AssignmentResponse toResponse(LineLeaderAssignment a) {
        return AssignmentResponse.builder()
                .assignmentId(a.getId())
                .lineId(a.getLine().getId())
                .lineName(a.getLine().getLineName())
                .leaderId(a.getLeader().getId())
                .leaderEmployeeCode(a.getLeader().getEmployeeCode())
                .leaderUsername(a.getLeader().getAccount() != null
                        ? a.getLeader().getAccount().getUsername() : null)
                .status(a.getStatus())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .build();
    }
}