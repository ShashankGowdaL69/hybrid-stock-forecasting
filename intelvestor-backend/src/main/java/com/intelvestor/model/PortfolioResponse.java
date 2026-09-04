package com.intelvestor.model;

import java.util.List;

public class PortfolioResponse {
    private List<Holding> holdings;
    private Double totalValue;

    public PortfolioResponse() {
    }

    public List<Holding> getHoldings() {
        return holdings;
    }

    public void setHoldings(List<Holding> holdings) {
        this.holdings = holdings;
    }

    public Double getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(Double totalValue) {
        this.totalValue = totalValue;
    }

    public static class Holding {
        private String symbol;
        private Integer quantity;
        private Double purchasePrice;

        public Holding() {
        }

        public Holding(String symbol, Integer quantity, Double purchasePrice) {
            this.symbol = symbol;
            this.quantity = quantity;
            this.purchasePrice = purchasePrice;
        }

        public String getSymbol() {
            return symbol;
        }

        public void setSymbol(String symbol) {
            this.symbol = symbol;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public Double getPurchasePrice() {
            return purchasePrice;
        }

        public void setPurchasePrice(Double purchasePrice) {
            this.purchasePrice = purchasePrice;
        }
    }
}