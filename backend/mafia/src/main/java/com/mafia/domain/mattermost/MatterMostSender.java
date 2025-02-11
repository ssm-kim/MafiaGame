package com.mafia.domain.mattermost;

import com.google.gson.Gson;
import com.mafia.domain.mattermost.dto.MatterMostMessageDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class MatterMostSender {

    private final Logger log = LoggerFactory.getLogger(MatterMostSender.class);
    private final RestTemplate restTemplate;
    private final MattermostProperties mmProperties;

    public void sendMessage(Exception exception, String uri, String params) {
        if (!mmProperties.isMmEnabled()) {
            log.info("Mattermost 알림이 비활성화되어 있습니다.");
            return;
        }

        try {
            MatterMostMessageDTO.Attachment attachment = MatterMostMessageDTO.Attachment.builder()
                .channel(mmProperties.getChannel())
                .authorName(mmProperties.getAuthorName())
                .color(mmProperties.getColor())
                .pretext(mmProperties.getPretext())
                .title(mmProperties.getTitle())
                .text(mmProperties.getText())
                .footer(mmProperties.getFooter())
                .build();

            attachment.addExceptionInfo(exception, uri, params);
            MatterMostMessageDTO.Attachments attachments = new MatterMostMessageDTO.Attachments(
                attachment);
            attachments.addProps(exception);
            String payload = new Gson().toJson(attachments);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(mmProperties.getWebhookUrl(), entity, String.class);

        } catch (Exception e) {
            log.error("#### ERROR!! Mattermost 전송 실패: {}", e.getMessage());
        }
    }
}
