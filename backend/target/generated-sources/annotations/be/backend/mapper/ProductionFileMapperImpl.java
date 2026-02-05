package be.backend.mapper;

import be.backend.entity.ProductionFile;
import be.backend.model.response.ProductionFileResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-05T14:56:07+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.12 (Oracle Corporation)"
)
@Component
public class ProductionFileMapperImpl implements ProductionFileMapper {

    @Override
    public ProductionFileResponse toResponse(ProductionFile file) {
        if ( file == null ) {
            return null;
        }

        ProductionFileResponse productionFileResponse = new ProductionFileResponse();

        productionFileResponse.setUrl( file.getS3Key() );
        productionFileResponse.setId( file.getId() );
        productionFileResponse.setFileName( file.getFileName() );
        productionFileResponse.setUploadedBy( file.getUploadedBy() );

        productionFileResponse.setUploadedAt( file.getUploadedAt() != null ? file.getUploadedAt().toString() : null );

        return productionFileResponse;
    }
}
