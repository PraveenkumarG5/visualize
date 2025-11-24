package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;
import java.util.Map;

public class SampleDataResponse {
    private List<String> columns;
    private List<Map<String, Object>> rows;
    
    public SampleDataResponse() {}
    
    public SampleDataResponse(List<String> columns, List<Map<String, Object>> rows) {
        this.columns = columns;
        this.rows = rows;
    }
    
    // Getters and Setters
    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
    
    public List<Map<String, Object>> getRows() { return rows; }
    public void setRows(List<Map<String, Object>> rows) { this.rows = rows; }
}

