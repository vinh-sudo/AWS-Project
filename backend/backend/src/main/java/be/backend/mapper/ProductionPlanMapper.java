package be.backend.mapper;

import be.backend.entity.ProductionPlan;
import be.backend.model.response.ProductionPlanResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductionPlanMapper {

    @Mapping(source = "line.lineName", target = "lineName")
    @Mapping(source = "plannedStartTime", target = "startTime")
    @Mapping(source = "plannedEndTime", target = "endTime")
    ProductionPlanResponse toResponse(ProductionPlan plan);

    List<ProductionPlanResponse> toResponseList(List<ProductionPlan> plans);
}
