package be.backend.mapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import be.backend.entity.Account;
import be.backend.entity.User;
import be.backend.model.response.LoginResponse;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "employeeCode", source = "employee.employeeCode")
    @Mapping(target = "fullName", source = "account", qualifiedByName = "getFullName")
    @Mapping(target = "email", source = "account", qualifiedByName = "getEmail")
    @Mapping(target = "accessToken", ignore = true)      // Set sau trong Service
    @Mapping(target = "refreshToken", ignore = true)     // Set sau trong Service
    @Mapping(target = "tokenType", constant = "Bearer")  // Giá trị cố định
    @Mapping(target = "expiresIn", ignore = true)        // Set sau trong Service
    LoginResponse toLoginResponse(Account account);
//ignore, defaultValue de ko bi null
// muon ignore all value @BeanMapping ignoreDefaultValues = true
// tao 1 ham rieng de xu ly fullName thi can qualifiedByName
    @Named("getFullName")
    default String getFullName(Account account) {
        User user = null;
        if (account.getUser() != null) {
            user = account.getUser();
        } else if (account.getEmployee() != null && account.getEmployee().getUser() != null) {
            user = account.getEmployee().getUser();
        }
        if (user == null) return "";
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        return (firstName + " " + lastName).trim();
    }
    
    @Named("getEmail")
    default String getEmail(Account account) {
        if (account.getUser() != null) {
            return account.getUser().getEmail();
        } else if (account.getEmployee() != null && account.getEmployee().getUser() != null) {
            return account.getEmployee().getUser().getEmail();
        }
        return "";
    }
}
