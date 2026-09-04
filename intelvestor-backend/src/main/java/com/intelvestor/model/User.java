package com.intelvestor.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id; // Clerk user ID
    private String email;
    private String name;
    private List<String> watchlist; // Ticker symbols
    private Map<String, Object> preferences;
    private String token; // JWT token for authentication

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}