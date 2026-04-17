package be.backend.model.response;

import lombok.Data;

@Data
public class ProductionFileResponse {
    private Long id;
    private String fileName;
    private String url;
    private String uploadedAt;
    private Integer uploadedBy;
}