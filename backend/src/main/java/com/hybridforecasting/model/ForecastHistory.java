package com.hybridforecasting.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "forecast_history")
public class ForecastHistory {

    @Id
    private String id;

    private String clerkUserId;
    private String symbol;
    private int horizon;
    private Instant generatedAt;

    private double currentPrice;
    private double finalForecast;
    private double expectedChange;
    private double sentimentScore;
    private double ensembleMape;
}