package com.hybridforecasting.security;

import com.auth0.jwt.JWT;
import com.clerk.backend_api.helpers.security.AuthenticateRequest;
import com.clerk.backend_api.helpers.security.models.AuthenticateRequestOptions;
import com.clerk.backend_api.helpers.security.models.RequestState;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClerkAuthenticationService {

    @Value("${clerk.secret.key:}")
    private String clerkSecretKey;

    public String authenticate(HttpServletRequest request) {

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing authentication token"
            );
        }

        try {
            Map<String, List<String>> headers = new HashMap<>();

            Enumeration<String> headerNames =
                    request.getHeaderNames();

            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {

                    String headerName =
                            headerNames.nextElement();

                    headers.put(
                            headerName,
                            Collections.list(
                                    request.getHeaders(headerName)
                            )
                    );
                }
            }

            RequestState requestState =
                    AuthenticateRequest.authenticateRequest(
                            headers,
                            AuthenticateRequestOptions
                                    .secretKey(clerkSecretKey)
                                    .build()
                    );

            if (!requestState.isSignedIn()) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid or expired authentication token"
                );
            }

            String token =
                    authorizationHeader.substring("Bearer ".length());

            return JWT.decode(token).getSubject();

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication failed"
            );
        }
    }
}