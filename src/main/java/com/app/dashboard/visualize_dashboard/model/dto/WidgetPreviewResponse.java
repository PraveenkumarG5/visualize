package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;
import java.util.Map;

public class WidgetPreviewResponse {
    private List<String> labels;
    private List<Object> values;
    private List<Map<String, Object>> rawData;
    
    // Getters and Setters
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    
    public List<Object> getValues() { return values; }
    public void setValues(List<Object> values) { this.values = values; }
    
    public List<Map<String, Object>> getRawData() { return rawData; }
    public void setRawData(List<Map<String, Object>> rawData) { this.rawData = rawData; }
}

