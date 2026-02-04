package be.backend.mapper;

import be.backend.entity.Order;
import be.backend.entity.OrderItem;
import be.backend.entity.User;
import be.backend.model.request.CreateOrderRequest;
import be.backend.model.request.OrderItemRequest;
import be.backend.model.response.OrderItemResponse;
import be.backend.model.response.OrderResponse;
import org.mapstruct.*;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "items", ignore = true)
    Order toEntity(CreateOrderRequest request);

    @Mapping(target = "createdByName", source = "createdBy", qualifiedByName = "getFullName")
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "createdById", source = "createdBy.id")
    OrderResponse toResponse(Order order);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    OrderItem toOrderItemEntity(OrderItemRequest request);

    OrderItemResponse toOrderItemResponse(OrderItem item);

    default List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(this::toOrderItemResponse).toList();
    }

    @Named("getFullName")
    default String getFullName(User user) {
        if (user == null) return "Unknown";
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        return (firstName + " " + lastName).trim();
    }
}