package com.hybridforecasting.controller;

import com.hybridforecasting.model.MLResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class StockController {

    @Value("${ml.service.url:http://ml:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate;

    public StockController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/stocks/{symbol}/predict")
    public MLResponse predict(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "30") int horizon) {

        if (symbol == null || symbol.trim().isEmpty()
                || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException(
                    "Invalid stock symbol: " + symbol
            );
        }

        String url = mlServiceUrl
                + "/ml/predict?symbol="
                + symbol.trim().toUpperCase()
                + "&horizon="
                + horizon;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        return restTemplate
                .exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        MLResponse.class
                )
                .getBody();
    }

        @GetMapping("/ml/current-price")
    public Object currentPrice(
            @RequestParam String symbol) {

        if (symbol == null || symbol.trim().isEmpty()
                || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException(
                    "Invalid stock symbol: " + symbol
            );
        }

        String url = mlServiceUrl
                + "/ml/current-price?symbol="
                + java.net.URLEncoder.encode(
                        symbol.trim().toUpperCase(),
                        java.nio.charset.StandardCharsets.UTF_8
                );

        return restTemplate
                .getForObject(url, Object.class);
    }

        @PostMapping("/ml/sentiment")
    public Object analyzeSentiment(
            @RequestParam String symbol,
            @RequestParam String text) {

        if (symbol == null || symbol.trim().isEmpty()
                || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException(
                    "Invalid stock symbol: " + symbol
            );
        }

        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Sentiment text is required"
            );
        }

        String url = mlServiceUrl
                + "/ml/sentiment?symbol="
                + java.net.URLEncoder.encode(
                        symbol.trim().toUpperCase(),
                        java.nio.charset.StandardCharsets.UTF_8
                )
                + "&text="
                + java.net.URLEncoder.encode(
                        text.trim(),
                        java.nio.charset.StandardCharsets.UTF_8
                );

        return restTemplate.postForObject(url, null, Object.class);
    }

    @GetMapping("/market-data")
    public Object marketData(
            @RequestParam String symbol) {

        if (symbol == null || symbol.trim().isEmpty()
                || symbol.contains("{") || symbol.contains("}")) {
            throw new IllegalArgumentException(
                    "Invalid stock symbol: " + symbol
            );
        }

        String url = mlServiceUrl
                + "/ml/market-data?symbol="
                + symbol.trim().toUpperCase();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        return restTemplate
                .exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        Object.class
                )
                .getBody();
    }


    @PostMapping("/ml/shap-explanation")
    public Object shapExplanation(
            @RequestBody Map<String, Object> request) {

        String url = mlServiceUrl + "/ml/shap-explanation";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(request, headers);

        return restTemplate
                .exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        Object.class
                )
                .getBody();
    }
}