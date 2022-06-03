package com.user.user.utility;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.util.Date;

public class JwtGenerator {
    private static final Algorithm algorithm = Algorithm.HMAC256("secret".getBytes());

    public static String generateAccessToken(String username, String role, String issuer) {

        return JWT.create()
                .withSubject(username)
                .withExpiresAt(new Date(System.currentTimeMillis() + 10 * 60 * 1000))
                .withIssuer(issuer)
                .withClaim("role", role)
                .sign(algorithm);
    }

    public static String generateRefreshToken(String username, String issuer) {

        return JWT.create()
                .withSubject(username)
                .withExpiresAt(new Date(System.currentTimeMillis() + 30 * 60 * 1000))
                .withIssuer(issuer)
                .sign(algorithm);
    }
}
