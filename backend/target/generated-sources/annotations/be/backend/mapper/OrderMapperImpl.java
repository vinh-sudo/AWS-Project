package be.backend.mapper;

import be.backend.entity.Order;
import be.backend.entity.OrderItem;
import be.backend.entity.User;
import be.backend.model.request.CreateOrderRequest;
import be.backend.model.request.OrderItemRequest;
import be.backend.model.response.OrderItemResponse;
import be.backend.model.response.OrderResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-11T16:16:43+0800",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.12 (Oracle Corporation)"
)
@Component
public class OrderMapperImpl implements OrderMapper {

    @Override
    public Order toEntity(CreateOrderRequest request) {
        if ( request == null ) {
            return null;
        }

        Order order = new Order();

        order.setCustomerName( request.getCustomerName() );
        order.setProductType( request.getProductType() );
        order.setQuantity( request.getQuantity() );
        order.setDeadline( request.getDeadline() );
        order.setPriority( request.getPriority() );

        return order;
    }

    @Override
    public OrderResponse toResponse(Order order) {
        if ( order == null ) {
            return null;
        }

        OrderResponse.OrderResponseBuilder orderResponse = OrderResponse.builder();

        orderResponse.createdByName( getFullName( order.getCreatedBy() ) );
        orderResponse.createdById( orderCreatedById( order ) );
        orderResponse.id( order.getId() );
        orderResponse.customerName( order.getCustomerName() );
        orderResponse.productType( order.getProductType() );
        orderResponse.quantity( order.getQuantity() );
        orderResponse.deadline( order.getDeadline() );
        orderResponse.priority( order.getPriority() );
        orderResponse.status( order.getStatus() );
        orderResponse.createdAt( order.getCreatedAt() );
        orderResponse.updatedAt( order.getUpdatedAt() );

        return orderResponse.build();
    }

    @Override
    public OrderItem toOrderItemEntity(OrderItemRequest request) {
        if ( request == null ) {
            return null;
        }

        OrderItem orderItem = new OrderItem();

        orderItem.setProductName( request.getProductName() );
        orderItem.setQuantity( request.getQuantity() );
        orderItem.setPrice( request.getPrice() );

        return orderItem;
    }

    @Override
    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        if ( item == null ) {
            return null;
        }

        OrderItemResponse.OrderItemResponseBuilder orderItemResponse = OrderItemResponse.builder();

        orderItemResponse.id( item.getId() );
        orderItemResponse.productName( item.getProductName() );
        orderItemResponse.quantity( item.getQuantity() );
        orderItemResponse.price( item.getPrice() );

        return orderItemResponse.build();
    }

    private Integer orderCreatedById(Order order) {
        if ( order == null ) {
            return null;
        }
        User createdBy = order.getCreatedBy();
        if ( createdBy == null ) {
            return null;
        }
        Integer id = createdBy.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
