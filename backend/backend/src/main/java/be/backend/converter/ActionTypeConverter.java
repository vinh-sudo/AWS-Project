package be.backend.converter;

import be.backend.enums.ActionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ActionTypeConverter implements AttributeConverter<ActionType, String> {

    @Override
    public String convertToDatabaseColumn(ActionType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ActionType convertToEntityAttribute(String dbData) {
        return ActionType.safeValueOf(dbData);
    }
}
