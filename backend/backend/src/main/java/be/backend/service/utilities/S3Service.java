package be.backend.service.utilities;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.time.Instant;

@Service
public class S3Service {

    @Autowired
    private S3Client s3Client;

    @Value("${aws.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String folderName) {
        try {

            String fileName = folderName + "/" + Instant.now().getEpochSecond() + "_" + file.getOriginalFilename();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            return String.format("https://%s.s3.%s.amazonaws.com/%s",
                    bucketName,
                    "ap-southeast-1",
                    fileName);

        } catch (S3Exception e) {
            throw new RuntimeException("Upload to S3 failed: " + e.awsErrorDetails().errorMessage(), e);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi đọc file: " + e.getMessage(), e);
        }
    }
}
