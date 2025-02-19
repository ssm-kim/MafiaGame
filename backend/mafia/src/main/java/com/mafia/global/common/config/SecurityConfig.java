package com.mafia.global.common.config;

import com.mafia.domain.login.filter.JWTFilter;
import com.mafia.domain.login.handler.CustomSuccessHandler;
import com.mafia.domain.login.service.CustomOAuth2UserService;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.baseUrl}")
    private String baseUrl;

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomSuccessHandler customSuccessHandler;
    private final JWTFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors((cors) -> corsConfigurationSource()) // 모든 도메인 일시적 허용
            .csrf((auth) -> auth.disable()) // csrf 일시적 비활성화
            .formLogin((auth) -> auth.disable()) // 기본 로그인 폼 비활성화
            .httpBasic((auth) -> auth.disable()); // HTTP 헤더 인증 방식 비활성화

        //JWTFilter
        http
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        //oauth2
        http
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo ->
                    userInfo.userService(customOAuth2UserService)
                )
                .successHandler(customSuccessHandler));

        //경로별 인가 작업
        http
            .authorizeHttpRequests((auth) -> auth
                .requestMatchers("/api/login/**", "/", "/error", "/swagger-ui/**", "/oauth2/**")
                .permitAll()
                .requestMatchers("/reissue")
                .permitAll()
                .requestMatchers("/ws-mafia")
                .permitAll()
                // .authenticated()) //TODO : 푸쉬 전에 제거
                .anyRequest().permitAll());
        //.anyRequest().authenticated()); //TODO : 개발 완료 시 처리

        //세션 설정 : STATELESS
        http
            .sessionManagement((session) -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        //config.setAllowedOrigins(
        //    Arrays.asList("http://localhost:3000", "http://localhost:8080")); // 프론트엔드 주소
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}