package be.backend.exception;

public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super("UNAUTHORIZED", message);
    }
}
