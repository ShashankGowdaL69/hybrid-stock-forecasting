package com.hybridforecasting.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MLResponse {

    private String symbol;
    private int horizon;
    private double lastPrice;
    private double arimaWeight;
    private double lstmWeight;
    private List<Map<String, Object>> forecast;
    private Map<String, Object> metrics;
}