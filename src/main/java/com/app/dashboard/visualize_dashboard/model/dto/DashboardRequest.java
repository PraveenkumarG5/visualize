package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.List;
import java.util.Map;

public class DashboardRequest {
    private String id;
    private String name;
    private String user;
    private Map<String, String> layout;
    private List<WidgetConfig> widgets;
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    
    public Map<String, String> getLayout() { return layout; }
    public void setLayout(Map<String, String> layout) { this.layout = layout; }
    
    public List<WidgetConfig> getWidgets() { return widgets; }
    public void setWidgets(List<WidgetConfig> widgets) { this.widgets = widgets; }
}

