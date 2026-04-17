package be.backend.exception;
public class SystemException extends AppException {
    public SystemException(String message) {
        super("SYSTEM_ERROR", message);
    }

    public SystemException(String message, Throwable cause) {
        super("SYSTEM_ERROR", message);
        initCause(cause);
    }
}
