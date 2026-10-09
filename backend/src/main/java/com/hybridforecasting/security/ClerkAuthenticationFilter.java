package com.hybridforecasting.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ClerkAuthenticationFilter extends OncePerRequestFilter {

    private final ClerkAuthenticationService authenticationService;

    public ClerkAuthenticationFilter(
            ClerkAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.startsWith("/actuator/health")
                || path.equals("/")
                || path.startsWith("/health")) {

            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/")) {

            String clerkUserId =
                    authenticationService.authenticate(request);

            request.setAttribute("clerkUserId", clerkUserId);
        }

        filterChain.doFilter(request, response);
    }
}