package be.backend.mapper;

import be.backend.entity.Order;
import be.backend.entity.ProductionLine;
import be.backend.entity.ProductionPlan;
import be.backend.model.response.ProductionPlanResponse;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-05T10:40:04+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.12 (Oracle Corporation)"
)
@Component
public class ProductionPlanMapperImpl implements ProductionPlanMapper {

    @Override
    public ProductionPlanResponse toResponse(ProductionPlan plan) {
        if ( plan == null ) {
            return null;
        }

        ProductionPlanResponse.ProductionPlanResponseBuilder productionPlanResponse = ProductionPlanResponse.builder();

        productionPlanResponse.planId( plan.getId() );
        productionPlanResponse.orderId( planOrderId( plan ) );
        productionPlanResponse.lineId( planLineId( plan ) );
        productionPlanResponse.lineName( planLineLineName( plan ) );
        productionPlanResponse.planName( plan.getPlanName() );
        productionPlanResponse.plannedQuantity( plan.getPlannedQuantity() );
        productionPlanResponse.startDate( plan.getPlannedStartDate() );
        productionPlanResponse.endDate( plan.getPlannedEndDate() );
        productionPlanResponse.decision( plan.getDecision() );
        productionPlanResponse.note( plan.getNote() );
        productionPlanResponse.estimatedHours( plan.getEstimatedHours() );

        return productionPlanResponse.build();
    }

    @Override
    public List<ProductionPlanResponse> toResponseList(List<ProductionPlan> plans) {
        if ( plans == null ) {
            return null;
        }

        List<ProductionPlanResponse> list = new ArrayList<ProductionPlanResponse>( plans.size() );
        for ( ProductionPlan productionPlan : plans ) {
            list.add( toResponse( productionPlan ) );
        }

        return list;
    }

    private Integer planOrderId(ProductionPlan productionPlan) {
        if ( productionPlan == null ) {
            return null;
        }
        Order order = productionPlan.getOrder();
        if ( order == null ) {
            return null;
        }
        Integer id = order.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Integer planLineId(ProductionPlan productionPlan) {
        if ( productionPlan == null ) {
            return null;
        }
        ProductionLine line = productionPlan.getLine();
        if ( line == null ) {
            return null;
        }
        Integer id = line.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String planLineLineName(ProductionPlan productionPlan) {
        if ( productionPlan == null ) {
            return null;
        }
        ProductionLine line = productionPlan.getLine();
        if ( line == null ) {
            return null;
        }
        String lineName = line.getLineName();
        if ( lineName == null ) {
            return null;
        }
        return lineName;
    }
}
