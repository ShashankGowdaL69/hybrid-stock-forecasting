package com.hybridforecasting.repository;

import com.hybridforecasting.model.ForecastHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ForecastHistoryRepository
        extends MongoRepository<ForecastHistory, String> {

    List<ForecastHistory> findTop20ByClerkUserIdOrderByGeneratedAtDesc(
            String clerkUserId
    );
}