package be.backend.mapper;

import be.backend.entity.ProductionFile;
import be.backend.model.response.ProductionFileResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ProductionFileMapper {

    @Mapping(target = "url", source = "s3Key")
    @Mapping(
            target = "uploadedAt",
            expression = "java(file.getUploadedAt() != null ? file.getUploadedAt().toString() : null)"
    )
    ProductionFileResponse toResponse(ProductionFile file);

        // Map multiple ProductionFile entities to a response list
    List<ProductionFileResponse> toResponseList(List<ProductionFile> files);
}
