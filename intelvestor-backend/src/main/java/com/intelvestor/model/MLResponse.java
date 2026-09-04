package com.intelvestor.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MLResponse {
    private String symbol;
    private int horizon;
    private List<Map<String, Object>> predictions;
    private List<Map<String, Object>> shap;
    private Map<String, Object> sentiment;
    private String explanation;

    public void setPrediction(List<Map<String, Object>> prediction) {
        this.predictions = prediction;
    }

    public List<Map<String, Object>> getPrediction() {
        return this.predictions;
    }
}