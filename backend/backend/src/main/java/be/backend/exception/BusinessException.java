package be.backend.exception;

public class BusinessException extends AppException {
    public BusinessException(String message) {
        super("BUSINESS_ERROR", message);
    }
}
