package be.backend.exception;

public class ForbiddenException extends AppException {
    public ForbiddenException(String message) {
        super("FORBIDDEN", message);
    }
}
