package be.backend.service;

import be.backend.entity.Order;
import be.backend.entity.ProductionFile;
import be.backend.repository.OrderRepository;
import be.backend.repository.ProductionFileRepository;
import be.backend.service.utilities.S3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductionFileService {
    private final S3Service s3Service;
    private final OrderRepository orderRepo;
    private final ProductionFileRepository fileRepo;

    @Transactional
    public ProductionFile uploadForOrder(
            Integer orderId,
            MultipartFile file,
            Integer userId
    ) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String s3Url = s3Service.uploadFile(file, "orders/" + orderId);

        ProductionFile f = new ProductionFile();
        f.setOrder(order);
        f.setFileName(file.getOriginalFilename());
        f.setS3Key(s3Url);
        f.setUploadedBy(userId);
        f.setUploadedAt(OffsetDateTime.now());

        return fileRepo.save(f);
    }

    // Get the file list (POM/SOP, production documents) for an order
    public List<ProductionFile> getFilesForOrder(Integer orderId) {
        return fileRepo.findByOrderId(orderId);
    }
}
