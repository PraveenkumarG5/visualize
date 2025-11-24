package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;
import java.util.Map;

public class AggregateRequest {
    private String type; // "open" or "release"
    private List<String> groupBy;
    private String operation; // "count", "sum", "avg"
    private String valueColumn;
    private Map<String, Object> filters;
    
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public List<String> getGroupBy() { return groupBy; }
    public void setGroupBy(List<String> groupBy) { this.groupBy = groupBy; }
    
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    
    public String getValueColumn() { return valueColumn; }
    public void setValueColumn(String valueColumn) { this.valueColumn = valueColumn; }
    
    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }
}

