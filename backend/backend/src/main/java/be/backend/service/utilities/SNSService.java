package be.backend.service.utilities;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

@Service
@RequiredArgsConstructor
public class SNSService {
    private final SnsClient snsClient;

    public void publishToTopic(String topicArn, String message, String subject) {
        PublishRequest request = PublishRequest.builder()
                .topicArn(topicArn)
                .message(message)
                .subject(subject)
                .build();
        PublishResponse response = snsClient.publish(request);
        // You can log response.messageId() if needed
    }
}

