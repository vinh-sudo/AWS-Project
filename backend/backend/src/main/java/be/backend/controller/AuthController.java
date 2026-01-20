//package be.backend.controller;
//
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import be.backend.model.request.LoginRequest;
//import be.backend.model.response.LoginResponse;
//import be.backend.service.AuthService;
//import io.swagger.v3.oas.annotations.parameters.RequestBody;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//
//@RestController
//@RequestMapping("/api/auth")
//@RequiredArgsConstructor
//public class AuthController {
//    private final AuthService authService = null;
//
//
//    @PostMapping("/login")
//    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
//        // @RequestBody: Parse JSON từ request body thành LoginRequest object
//        LoginResponse response = authService.login(request);
//        return ResponseEntity.ok(response);
//    }
//}
