//package be.backend.service.manager;
//
//import be.backend.entity.*;
//import be.backend.repository.*;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.OffsetDateTime;
//import java.util.ArrayList;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class ManagerPlanningService {
//
//    private final OrderRepository orderRepo;
//    private final ProductionLineRepository lineRepo;
//    private final ProductionPlanRepository planRepo;
//    private final EmployeeRepository employeeRepo;
//    private final ProductionPlanMapper mapper;
//
//    @Transactional
//    public List<ProductionPlanResponse> planOrder(
//            Long orderId,
//            Long managerEmployeeId,
//            OffsetDateTime startTime
//    ) {
//        Order order = orderRepo.findById(orderId).orElseThrow();
//        Employee manager = employeeRepo.findById(managerEmployeeId).orElseThrow();
//
//        List<ProductionLine> lines = lineRepo.findAllByOrderByLineId();
//
//        OffsetDateTime cursor = startTime;
//        List<ProductionPlan> plans = new ArrayList<>();
//
//        for (ProductionLine line : lines) {
//
//            double hourlyCapacity = line.getCapacity() * line.getEfficiency();
//            double hours = order.getQuantity() / hourlyCapacity;
//
//            ProductionPlan plan = new ProductionPlan();
//            plan.setOrder(order);
//            plan.setLine(line);
//            plan.setPlannedQuantity(order.getQuantity());
//            plan.setEstimatedHours(hours);
//            plan.setPlannedStartTime(cursor);
//            plan.setPlannedEndTime(cursor.plusHours((long) Math.ceil(hours)));
//            plan.setStatus("PLANNED");
//            plan.setCreatedBy(manager);
//            plan.setCreatedAt(OffsetDateTime.now());
//
//            plans.add(plan);
//            cursor = plan.getPlannedEndTime();
//        }
//
//        planRepo.saveAll(plans);
//        order.setStatus("PLANNED");
//
//        return mapper.toResponseList(plans);
//    }
//}
//
