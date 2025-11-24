package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;

public class AggregateResponse {
    private List<String> labels;
    private List<Object> values;
    private Object value; // For single aggregate without grouping
    
    // Getters and Setters
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    
    public List<Object> getValues() { return values; }
    public void setValues(List<Object> values) { this.values = values; }
    
    public Object getValue() { return value; }
    public void setValue(Object value) { this.value = value; }
}

