package com.intelvestor.controller;

import com.intelvestor.model.User;
import com.intelvestor.service.UserService;
import com.auth0.jwt.JWT;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(@RequestHeader("Authorization") String authHeader,
            @RequestBody User userData) {
        String token = authHeader.replace("Bearer ", "");
        try {
            DecodedJWT jwt = JWT.decode(token);
            String clerkUserId = jwt.getSubject();
            String email = jwt.getClaim("email").asString();
            String name = jwt.getClaim("name").asString();
            User user = userService.saveUser(clerkUserId, email, name);
            return ResponseEntity.ok(user);
        } catch (JWTDecodeException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<User> getUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            DecodedJWT jwt = JWT.decode(token);
            String clerkUserId = jwt.getSubject();
            User user = userService.findById(clerkUserId);
            return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
        } catch (JWTDecodeException e) {
            return ResponseEntity.status(401).build();
        }
    }
}