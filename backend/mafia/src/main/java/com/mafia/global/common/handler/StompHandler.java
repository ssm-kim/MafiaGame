package com.mafia.global.common.handler;


import com.mafia.domain.chat.model.StompPrincipal;
import com.mafia.domain.login.model.dto.AuthenticatedUser;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompHandler implements ChannelInterceptor{
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null) {
            Principal principal = accessor.getUser();
            log.info(principal.toString());
            // 만약 principal이 Authentication 토큰인 경우 내부의 principal을 확인합니다.
            if (principal instanceof UsernamePasswordAuthenticationToken token) {
                log.info("flag2");
                Object userObj = token.getPrincipal();
                if (userObj instanceof AuthenticatedUser user) {
                    //log.info("user Data" + user.getMemberDto().toString());
                    log.info("AuthenticatedUser: memberId: {}", user.getMemberId());
                    // 여기서 AuthenticatedUser에서 필요한 값을 꺼내 StompPrincipal 생성
                    //AuthenticatedUser principal = (AuthenticatedUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                    StompPrincipal stompPrincipal =
                        new StompPrincipal(user.getMemberId());
                    accessor.setUser(stompPrincipal);
                }
            }
        }
        return message;
    }
}
