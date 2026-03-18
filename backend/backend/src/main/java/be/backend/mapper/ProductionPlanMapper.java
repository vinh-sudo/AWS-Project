package be.backend.mapper;

import be.backend.entity.ProductionPlan;
import be.backend.model.response.ProductionPlanResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductionPlanMapper {
    @Mapping(source = "id", target = "planId")
    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "orderItem.id", target = "orderItemId")
    @Mapping(source = "line.id", target = "lineId")
    @Mapping(source = "line.lineName", target = "lineName")
    @Mapping(source = "planName", target = "planName")
    @Mapping(source = "plannedQuantity", target = "plannedQuantity")
    @Mapping(source = "plannedStartDate", target = "startDate")
    @Mapping(source = "plannedEndDate", target = "endDate")
    @Mapping(source = "estimatedHours", target = "estimatedHours")
    @Mapping(source = "decision", target = "decision")
    @Mapping(source = "note", target = "note")
    ProductionPlanResponse toResponse(ProductionPlan plan);
    List<ProductionPlanResponse> toResponseList(List<ProductionPlan> plans);
}
