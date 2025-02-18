package com.mafia.domain.game.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_FOUND_SESSION;

import com.mafia.global.common.exception.exception.BusinessException;
import io.openvidu.java.client.Connection;
import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Session;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VoiceService {

    @Value("${openvidu.url}") String openviduUrl;
    @Value("${openvidu.secret}") String secret;

    private final OpenVidu openvidu;
    private final Map<Long, Session> gameSessions = new HashMap<>(); // 게임별 세션 저장
    private final Map<Long, Map<Long, String>> playerTokens = new HashMap<>(); // 게임 내 플레이어별 토큰 저장

    // OpenVidu 객체를 생성자에서 초기화
    public VoiceService(@Value("${openvidu.url}") String openviduUrl, // secret 참조 Value 주입 받은 후 객체 생성
        @Value("${openvidu.secret}") String secret) {
        this.openviduUrl = openviduUrl;
        this.secret = secret;
        this.openvidu = new OpenVidu(openviduUrl, secret);
    }

    /**
     * 게임 시작 시 OpenVidu 세션 생성
     */
    protected String createSession(long gameId)
        throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openvidu.createSession();
        gameSessions.put(gameId, session);
        playerTokens.put(gameId, new HashMap<>());
        return session.getSessionId();
    }

    /**
     * 특정 플레이어에게 토큰 발급 (음성 채팅 참여)
     */
    protected String generateToken(long gameId, long playerNo)
        throws OpenViduJavaClientException, OpenViduHttpException {
        if (!gameSessions.containsKey(gameId)) {
            throw new BusinessException(NOT_FOUND_SESSION);
        }

        Session session = gameSessions.get(gameId);
        ConnectionProperties properties = new ConnectionProperties.Builder()
            .type(ConnectionType.WEBRTC)
            .data("Player " + playerNo)
            .build();

        Connection connection = session.createConnection(properties);
        String token = connection.getToken();
        playerTokens.get(gameId).put(playerNo, token);

        return token;
    }

    /**
     * 게임 종료 시 OpenVidu 세션 종료
     */
    protected void closeSession(long gameId)
        throws OpenViduJavaClientException, OpenViduHttpException {
        if (gameSessions.containsKey(gameId)) {
            gameSessions.get(gameId).close();
            gameSessions.remove(gameId);
            playerTokens.remove(gameId);
        }
    }
}
