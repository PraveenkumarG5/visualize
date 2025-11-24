package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;
import java.util.Map;

public class WidgetConfig {
    private String id;
    private String type; // "pie", "bar", "stackedBar", "line", "table", "number"
    private String dataSource; // "open" or "release"
    private String title;
    private List<String> columns;
    private List<String> groupBy;
    private String operation; // "count", "sum", "avg"
    private String valueColumn;
    private Map<String, Object> filters;
    private Map<String, Object> options;
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
    
    public List<String> getGroupBy() { return groupBy; }
    public void setGroupBy(List<String> groupBy) { this.groupBy = groupBy; }
    
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    
    public String getValueColumn() { return valueColumn; }
    public void setValueColumn(String valueColumn) { this.valueColumn = valueColumn; }
    
    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }
    
    public Map<String, Object> getOptions() { return options; }
    public void setOptions(Map<String, Object> options) { this.options = options; }
}

