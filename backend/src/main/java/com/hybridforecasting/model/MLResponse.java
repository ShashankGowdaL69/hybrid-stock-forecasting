package com.hybridforecasting.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MLResponse {

    private String symbol;

    private int horizon;

    @JsonProperty("last_price")
    private double lastPrice;

    @JsonProperty("arima_weight")
    private double arimaWeight;

    @JsonProperty("lstm_weight")
    private double lstmWeight;

    @JsonProperty("xgb_weight")
    private double xgbWeight;

    private List<Map<String, Object>> forecast;

    private Map<String, Object> metrics;

    private List<Map<String, Object>> shap;

    @JsonProperty("shap_features")
    private Map<String, Object> shapFeatures;

    private Map<String, Object> sentiment;
}