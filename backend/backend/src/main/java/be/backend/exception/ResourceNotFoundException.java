package be.backend.exception;

public class ResourceNotFoundException extends AppException {
     public ResourceNotFoundException(String message) {
        super("NOT_FOUND", message);
    }    
    public ResourceNotFoundException(String resource, String id) {
        super("NOT_FOUND", resource + " with id " + id + " not found");
    }
}

