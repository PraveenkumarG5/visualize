package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;

public class FileValidationResponse {
    private boolean exists;
    private List<String> columns;
    private String message;
    
    public FileValidationResponse() {}
    
    public FileValidationResponse(boolean exists, List<String> columns, String message) {
        this.exists = exists;
        this.columns = columns;
        this.message = message;
    }
    
    // Getters and Setters
    public boolean isExists() { return exists; }
    public void setExists(boolean exists) { this.exists = exists; }
    
    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

