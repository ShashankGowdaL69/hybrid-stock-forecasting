package com.hybridforecasting.controller;

import com.hybridforecasting.model.ForecastHistory;
import com.hybridforecasting.model.User;
import com.hybridforecasting.repository.ForecastHistoryRepository;
import com.hybridforecasting.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final ForecastHistoryRepository historyRepository;

    public UserController(
            UserRepository userRepository,
            ForecastHistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    @GetMapping("/me")
    public User getCurrentUser(HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        return userRepository
                .findByClerkUserId(clerkUserId)
                .orElseGet(() -> createUser(clerkUserId));
    }

    @PostMapping("/watchlist/{symbol}")
    public User addToWatchlist(
            @PathVariable String symbol,
            HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        User user = userRepository
                .findByClerkUserId(clerkUserId)
                .orElseGet(() -> createUser(clerkUserId));

        String cleanSymbol = symbol.trim().toUpperCase();

        if (user.getWatchlist().contains(cleanSymbol)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    cleanSymbol + " is already in your watchlist."
            );
        }

        user.getWatchlist().add(cleanSymbol);

        return userRepository.save(user);
    }

    @DeleteMapping("/watchlist/{symbol}")
    public User removeFromWatchlist(
            @PathVariable String symbol,
            HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        User user = userRepository
                .findByClerkUserId(clerkUserId)
                .orElseGet(() -> createUser(clerkUserId));

        user.getWatchlist().remove(symbol.trim().toUpperCase());

        return userRepository.save(user);
    }

    @GetMapping("/watchlist")
    public List<String> getWatchlist(HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        User user = userRepository
                .findByClerkUserId(clerkUserId)
                .orElseGet(() -> createUser(clerkUserId));

        return user.getWatchlist();
    }

    @PostMapping("/history")
    public ForecastHistory saveHistory(
            @RequestBody ForecastHistory history,
            HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        history.setId(null);
        history.setClerkUserId(clerkUserId);
        history.setGeneratedAt(Instant.now());

        return historyRepository.save(history);
    }

    @GetMapping("/history")
    public List<ForecastHistory> getHistory(
            HttpServletRequest request) {

        String clerkUserId = getClerkUserId(request);

        return historyRepository
                .findTop20ByClerkUserIdOrderByGeneratedAtDesc(clerkUserId);
    }

    private String getClerkUserId(HttpServletRequest request) {

        Object value = request.getAttribute("clerkUserId");

        if (value == null) {
            throw new IllegalStateException(
                    "Authenticated Clerk user ID is missing"
            );
        }

        return value.toString();
    }

    private User createUser(String clerkUserId) {

        User user = new User();
        user.setClerkUserId(clerkUserId);

        return userRepository.save(user);
    }
}