package com.mafia.global.common.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JWTUtil {

    private SecretKey secretKey;
    @Value("${spring.jwt.access-token-validity}")
    private long accessTokenValidity;
    @Value("${spring.jwt.refresh-token-validity}")
    private long refreshTokenValidity;

    public JWTUtil(@Value("${spring.jwt.secret}") String secret) {
        secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
            Jwts.SIG.HS256.key().build().getAlgorithm());
    }

    public Long getMemberId(String token) {
        return Jwts.parser().verifyWith(secretKey).build()
            .parseSignedClaims(token).getPayload()
            .get("memberId", Long.class);
    }

    public String getProviderId(String token) {
        return Jwts.parser().verifyWith(secretKey).build()
            .parseSignedClaims(token).getPayload()
            .get("providerId", String.class);
    }


    public Boolean isExpired(String token) {
        return Jwts.parser().verifyWith(secretKey).build()
            .parseSignedClaims(token).getPayload()
            .getExpiration().before(new Date());
    }

    public String createAccessToken(String providerId, Long memberId) {
        return Jwts.builder()
            .claim("providerId", providerId)
            .claim("memberId", memberId)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + accessTokenValidity))
            .signWith(secretKey)
            .compact();
    }

    public String createRefreshToken(String providerId, Long memberId) {
        return Jwts.builder()
            .claim("providerId", providerId)
            .claim("memberId", memberId)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
            .signWith(secretKey)
            .compact();
    }

    public boolean validateToken(String token) {


        try {
            // 토큰 만료 및 유효성 검증
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            System.out.println("Token valid: "+ !isExpired(token));
            return !isExpired(token);
        } catch (Exception e) {
            e.getStackTrace();
            return false;
        }
    }


    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

}