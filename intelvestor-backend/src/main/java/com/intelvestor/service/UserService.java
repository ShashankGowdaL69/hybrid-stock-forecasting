package com.intelvestor.service;

import com.intelvestor.model.User;
import com.intelvestor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User saveUser(String clerkUserId, String email, String name) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            user = new User();
            user.setId(clerkUserId);
            user.setEmail(email);
            user.setName(name);
            user = userRepository.save(user);
        }
        return user;
    }

    public User findById(String clerkUserId) {
        return userRepository.findById(clerkUserId).orElse(null);
    }
}