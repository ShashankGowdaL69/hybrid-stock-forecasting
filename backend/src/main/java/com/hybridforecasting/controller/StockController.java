package com.hybridforecasting.controller;

import com.hybridforecasting.model.MLResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api")
public class StockController {

    @Value("${ML_SERVICE_URL:http://ml:8000}")
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
            throw new IllegalArgumentException("Invalid stock symbol: " + symbol);
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
                .exchange(url, HttpMethod.POST, entity, MLResponse.class)
                .getBody();
    }
}