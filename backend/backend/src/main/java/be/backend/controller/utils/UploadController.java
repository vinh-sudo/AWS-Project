package be.backend.controller.utils;

import be.backend.entity.Account;
import be.backend.mapper.ProductionFileMapper;
import be.backend.model.response.ProductionFileResponse;
import be.backend.service.ProductionFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {
    private final ProductionFileService fileService;
    private final ProductionFileMapper fileMapper;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/order/{orderId}/files")
    public ProductionFileResponse upload(
            @PathVariable Integer orderId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Account account
    ) {
        return fileMapper.toResponse(
                fileService.uploadForOrder(
                        orderId,
                        file,
                        account.getUser().getId()
                )
        );
    }

        // Get the file list (POM/SOP, production documents) for an order - allow any authenticated user to view it
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/admin/order/{orderId}/files")
    public List<ProductionFileResponse> getFilesForOrder(
            @PathVariable Integer orderId
    ) {
        return fileMapper.toResponseList(
                fileService.getFilesForOrder(orderId)
        );
    }
}
