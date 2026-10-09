package com.hybridforecasting.repository;

import com.hybridforecasting.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByClerkUserId(String clerkUserId);
}