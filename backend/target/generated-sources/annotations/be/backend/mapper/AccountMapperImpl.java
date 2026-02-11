package be.backend.mapper;

import be.backend.entity.Account;
import be.backend.entity.Employee;
import be.backend.entity.User;
import be.backend.model.response.LoginResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-11T16:16:43+0800",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.12 (Oracle Corporation)"
)
@Component
public class AccountMapperImpl implements AccountMapper {

    @Override
    public LoginResponse toLoginResponse(Account account) {
        if ( account == null ) {
            return null;
        }

        LoginResponse.LoginResponseBuilder loginResponse = LoginResponse.builder();

        if ( account.getId() != null ) {
            loginResponse.id( account.getId().longValue() );
        }
        loginResponse.employeeCode( accountEmployeeEmployeeCode( account ) );
        loginResponse.fullName( getFullName( account ) );
        loginResponse.email( accountUserEmail( account ) );
        loginResponse.username( account.getUsername() );
        loginResponse.role( account.getRole() );

        loginResponse.tokenType( "Bearer" );

        return loginResponse.build();
    }

    private String accountEmployeeEmployeeCode(Account account) {
        if ( account == null ) {
            return null;
        }
        Employee employee = account.getEmployee();
        if ( employee == null ) {
            return null;
        }
        String employeeCode = employee.getEmployeeCode();
        if ( employeeCode == null ) {
            return null;
        }
        return employeeCode;
    }

    private String accountUserEmail(Account account) {
        if ( account == null ) {
            return null;
        }
        User user = account.getUser();
        if ( user == null ) {
            return null;
        }
        String email = user.getEmail();
        if ( email == null ) {
            return null;
        }
        return email;
    }
}
