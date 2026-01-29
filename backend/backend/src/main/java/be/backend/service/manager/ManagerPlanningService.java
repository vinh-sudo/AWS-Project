package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.mapper.ProductionPlanMapper;
import be.backend.model.request.LinePlanRequest;
import be.backend.model.request.ProductionPlanRequest;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerPlanningService {

    private final OrderRepository orderRepo;
    private final ProductionLineRepository lineRepo;
    private final ProductionPlanRepository planRepo;
    private final EmployeeRepository employeeRepo;
    private final ProductionPlanMapper mapper;

    @Transactional
    public List<ProductionPlanResponse> createPlan(
            ProductionPlanRequest request,
            Account account
    ) {
        Order order = orderRepo.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Employee manager = employeeRepo.findByUserId(account.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Employee not found for this account"));

        List<ProductionPlan> plans = new ArrayList<>();

        for (LinePlanRequest lineReq : request.getLines()) {

            ProductionLine line = lineRepo.findById(lineReq.getLineId())
                    .orElseThrow(() -> new RuntimeException("Line not found"));

            int qty = lineReq.getPlannedQty();

            double capacity = line.getCapacity();
            double efficiency = line.getEfficiency().doubleValue();
            double hourlyCapacity = capacity * efficiency;
            double hours = qty / hourlyCapacity;

            ProductionPlan plan = new ProductionPlan();
            plan.setOrder(order);
            plan.setLine(line);
            plan.setCreatedBy(manager);
            plan.setPlannedQuantity(qty);
            plan.setPlannedStartDate(request.getStartDate());
            plan.setPlannedEndDate(
                    request.getStartDate().plusDays((long) Math.ceil(hours / 8))
            );
            plan.setEstimatedHours(hours);
            plan.setDecision("CONFIRM");
            plan.setCreatedAt(OffsetDateTime.now());

            plans.add(plan);
        }

        planRepo.saveAll(plans);
        order.setStatus("PLANNED");

        return mapper.toResponseList(plans);
    }
}


