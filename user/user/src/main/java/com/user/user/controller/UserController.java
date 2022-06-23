package com.user.user.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.user.user.model.Role;
import com.user.user.model.User;
import com.user.user.service.UserService;
import com.user.user.utility.JwtDecoder;
import com.user.user.utility.JwtGenerator;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.*;

import static org.springframework.http.HttpStatus.*;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@CrossOrigin("*")
public class UserController {
    private final UserService userService;

    @Lazy
    private final AuthenticationManager authenticationManager;

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok().body(userService.getUsers());
    }

    @PostMapping("/user/save")
    public ResponseEntity<?> saveUser(@RequestBody NewUserRequest newUserRequest) {
        return ResponseEntity.status(CREATED).body(userService.saveUser(newUserRequest));
    }

    @PostMapping("/role/save")
    public ResponseEntity<?> saveRole(Role role) {
        URI uri = URI.create(ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/role/save").toUriString());
        return ResponseEntity.created(uri).body(userService.saveRole(role));
    }

    @PatchMapping("/user/updateRole/{username}")
    public ResponseEntity<?> updateRole(@PathVariable String username, @RequestBody String roleName) {
        return ResponseEntity.ok().body(userService.updateUserRole(username, roleName));
    }

    @PatchMapping("/user/updateUser/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, Map<Object, Object> fields) {
        return ResponseEntity.ok().body(userService.updateUser(username, fields));
    }

    @GetMapping("/user/decodeJwt")
    public void decodeJwt(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authorizationHeader = request.getHeader("Authorization");
        Map<String, String> decodedToken = JwtDecoder.decodeJwt(authorizationHeader);
        if(!decodedToken.isEmpty()) {
            if(decodedToken.containsKey("error")) {
                response.setHeader("error", decodedToken.get("error"));
                response.setStatus(FORBIDDEN.value());
            } else {
                response.setStatus(OK.value());
            }
            response.setContentType(APPLICATION_JSON_VALUE);
            new ObjectMapper().writeValue(response.getOutputStream(), decodedToken);
        } else {
            response.setStatus(BAD_REQUEST.value());
            response.setContentType(APPLICATION_JSON_VALUE);
            Map<String, String> message = new HashMap<>();
            message.put("message", "The jwt token is missing.");
            new ObjectMapper().writeValue(response.getOutputStream(), message);
        }
    }

    @GetMapping("/user/refreshToken")
    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if(authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            try {
                String refreshToken = authorizationHeader.substring("Bearer ".length());
                Algorithm algorithm = Algorithm.HMAC256("secret".getBytes());
                JWTVerifier verifier = JWT.require(algorithm).build();
                DecodedJWT decodedJwt = verifier.verify(refreshToken);
                String username = decodedJwt.getSubject();

                User user = userService.getUser(username);

                String accessToken = JwtGenerator.generateAccessToken(user.getId(),
                        user.getRole().getRoleName(), request.getRequestURI());

                response.setHeader("accessToken", accessToken);
                response.setHeader("refreshToken", refreshToken);

                Map<String, String> tokens = new HashMap<>();
                tokens.put("accessToken", accessToken);
                tokens.put("refreshToken", refreshToken);

                response.setContentType(APPLICATION_JSON_VALUE);
                new ObjectMapper().writeValue(response.getOutputStream(), tokens);
            } catch (Exception e) {
                response.setHeader("error", e.getMessage());
                response.setStatus(FORBIDDEN.value());
                Map<String, String> error = new HashMap<>();
                error.put("errorMessage", e.getMessage());
                response.setContentType(APPLICATION_JSON_VALUE);
                new ObjectMapper().writeValue(response.getOutputStream(), error);
            }
        } else {
            throw new RuntimeException("Refresh token is missing");
        }
    }
}

