package com.mafia.domain.mattermost;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationManager {

    private final Logger log = LoggerFactory.getLogger(NotificationManager.class);
    private final MatterMostSender matterMostSender;

    public void sendNotification(Exception e, String uri, String params) {
        matterMostSender.sendMessage(e, uri, params);
    }
}