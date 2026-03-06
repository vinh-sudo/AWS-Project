package be.backend.service.ai;

import be.backend.model.ai.ParsedQuestion;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AIQuestionRouter {

    // Simple regex to capture integers in the question
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d{1,10})");

    public ParsedQuestion parse(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return ParsedQuestion.generic("");
        }
        String text = userMessage.trim();
        String lower = text.toLowerCase();

        boolean mentionsOrder = containsAny(lower,
                "order", "đơn hàng", "mã đơn", "đơn ");
        boolean mentionsSchedule = containsAny(lower,
                "schedule", "lịch", "lịch sản xuất");

        Integer id = extractFirstNumber(lower);

        if (mentionsOrder && id != null) {
            return new ParsedQuestion(ParsedQuestion.Domain.ORDER, id, null, text);
        }
        if (mentionsSchedule && id != null) {
            return new ParsedQuestion(ParsedQuestion.Domain.SCHEDULE, null, id, text);
        }


        if (mentionsOrder) {
            return new ParsedQuestion(ParsedQuestion.Domain.ORDER, null, null, text);
        }
        if (mentionsSchedule) {
            return new ParsedQuestion(ParsedQuestion.Domain.SCHEDULE, null, null, text);
        }

        return ParsedQuestion.generic(text);
    }

    private boolean containsAny(String lower, String... keywords) {
        for (String k : keywords) {
            if (lower.contains(k)) return true;
        }
        return false;
    }

    private Integer extractFirstNumber(String lower) {
        Matcher m = NUMBER_PATTERN.matcher(lower);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
