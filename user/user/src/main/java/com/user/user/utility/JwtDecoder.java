package com.user.user.utility;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.util.HashMap;
import java.util.Map;

public class JwtDecoder {
    private static final Algorithm algorithm = Algorithm.HMAC256("secret".getBytes());

    public static Map<String, String> decodeJwt(String token) {
        if(token != null && token.startsWith("Bearer ")) {
            try {
                String jwtToken = token.substring("Bearer ".length());
                JWTVerifier verifier = JWT.require(algorithm).build();
                DecodedJWT decodedJwt = verifier.verify(jwtToken);
                String username = decodedJwt.getSubject();
                String role = String.valueOf(decodedJwt.getClaim("role")).replace("\"", "");
                Map<String, String> userDetails = new HashMap<>();
                userDetails.put("username", username);
                userDetails.put("role", role);
                return userDetails;
            } catch (Exception e) {
                Map<String, String> error = new HashMap<>();
                if (e.toString().contains("expired")) error.put("error", "The JWT is expired.");
                else if (e.toString().contains("invalid")) error.put("error", "The JWT is invalid.");
                else error.put("error", e.toString());

                return error;
            }
        } else {
            return new HashMap<>();
        }
    }
}
