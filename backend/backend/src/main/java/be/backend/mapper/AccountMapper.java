package be.backend.mapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import be.backend.entity.Account;
import be.backend.model.response.LoginResponse;

@Mapper(componentModel = "spring")
public interface AccountMapper {  
    @Mapping(target = "id", source = "user.id") 
    @Mapping(target = "employeeCode", source = "employeeCode")
    @Mapping(target = "fullName", source = "account", qualifiedByName = "getFullName")
    @Mapping(target = "email", source = "user.email")  
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
        if (account.getUser() == null) return "";
        String firstName = account.getUser().getFirstName() != null ? account.getUser().getFirstName() : "";
        String lastName = account.getUser().getLastName() != null ? account.getUser().getLastName() : "";
        return (firstName + " " + lastName).trim();
    }
}
