package com.intelvestor.controller;

import com.intelvestor.model.MLResponse;
import com.intelvestor.model.PortfolioResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
public class StockController {

    private static final Logger logger = LoggerFactory.getLogger(StockController.class);

    @Value("${ML_SERVICE_URL:http://ml:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate;

    public StockController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/stocks/{symbol}/predict")
    public MLResponse predict(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "30") int horizon,
            @RequestHeader("Authorization") String authHeader) {
        logger.info("Received predict request for symbol: {}", symbol);
        if (symbol == null || symbol.trim().isEmpty() || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException("Invalid stock symbol: " + symbol);
        }

        try {
            String url = mlServiceUrl + "/ml/predict?symbol=" + symbol + "&horizon=" + horizon;
            logger.debug("Calling ML service: {}", url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            MLResponse response = restTemplate.exchange(url, HttpMethod.POST, entity, MLResponse.class).getBody();
            logger.info("Successfully received prediction for symbol: {}", symbol);
            return response;
        } catch (Exception e) {
            logger.error("Error calling ML service for symbol {}: {}", symbol, e.getMessage());
            throw new RuntimeException("Failed to get prediction from ML service: " + e.getMessage());
        }
    }

    @GetMapping("/stocks/{symbol}/social")
    public MLResponse socialInsights(@PathVariable String symbol, @RequestHeader("Authorization") String authHeader) {
        logger.info("Received social insights request for symbol: {}", symbol);
        if (symbol == null || symbol.trim().isEmpty() || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException("Invalid stock symbol: " + symbol);
        }

        try {
            String url = mlServiceUrl + "/ml/news-sentiment/" + symbol;
            logger.debug("Calling ML service for social insights: {}", url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            MLResponse response = restTemplate.exchange(url, HttpMethod.GET, entity, MLResponse.class).getBody();
            if (response != null) {
                response.setPrediction(null);
                response.setShap(null);
                response.setExplanation("Social insights and sentiment analysis from recent news and social media.");
            }
            return response;
        } catch (Exception e) {
            logger.error("Error calling ML service for social insights for symbol {}: {}", symbol, e.getMessage());
            throw new RuntimeException("Failed to get social insights from ML service: " + e.getMessage());
        }
    }

    @GetMapping("/market/overview")
    public Object getMarketOverview(@RequestHeader("Authorization") String authHeader) {
        logger.info("Received market overview request");
        try {
            String url = mlServiceUrl + "/ml/market-overview";
            logger.debug("Calling ML service for market overview: {}", url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            return restTemplate.exchange(url, HttpMethod.GET, entity, Object.class).getBody();
        } catch (Exception e) {
            logger.error("Error calling ML service for market overview: {}", e.getMessage());
            throw new RuntimeException("Failed to get market overview from ML service: " + e.getMessage());
        }
    }

    @GetMapping("/portfolio/analyze")
    public Object analyzePortfolio(@RequestParam String symbols, @RequestHeader("Authorization") String authHeader) {
        logger.info("Received portfolio analysis request for symbols: {}", symbols);
        try {
            String url = mlServiceUrl + "/ml/portfolio-analysis?symbols=" + symbols;
            logger.debug("Calling ML service for portfolio analysis: {}", url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            return restTemplate.exchange(url, HttpMethod.GET, entity, Object.class).getBody();
        } catch (Exception e) {
            logger.error("Error calling ML service for portfolio analysis: {}", e.getMessage());
            throw new RuntimeException("Failed to get portfolio analysis from ML service: " + e.getMessage());
        }
    }

    @GetMapping("/portfolio")
    public PortfolioResponse getPortfolio(@RequestHeader("Authorization") String authHeader) {
        logger.info("Received portfolio request for user");
        PortfolioResponse response = new PortfolioResponse();
        response.setHoldings(Arrays.asList(
                new PortfolioResponse.Holding("AXISBANK", 10, 1100.0),
                new PortfolioResponse.Holding("RELIANCE", 5, 2400.0)));
        response.setTotalValue(0.0); // Calculated on frontend
        return response;
    }
}