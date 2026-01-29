package be.backend.mapper;

import be.backend.entity.ProductionPlan;
import be.backend.model.response.ProductionPlanResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductionPlanMapper {

    @Mapping(source = "id", target = "planId")
    @Mapping(source = "line.lineName", target = "lineName")
    @Mapping(source = "plannedStartDate", target = "startDate")
    @Mapping(source = "plannedEndDate", target = "endDate")
    @Mapping(source = "decision", target = "status")
    ProductionPlanResponse toResponse(ProductionPlan plan);
    List<ProductionPlanResponse> toResponseList(List<ProductionPlan> plans);
}
