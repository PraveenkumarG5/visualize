package com.app.dashboard.visualize_dashboard.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "dashboards")
public class Dashboard {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "username")
    private String user;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ElementCollection
    @CollectionTable(name = "dashboard_layout", joinColumns = @JoinColumn(name = "dashboard_id"))
    @MapKeyColumn(name = "widget_id")
    @Column(name = "layout_data", length = 2000)
    private Map<String, String> layout;
    
    @Column(columnDefinition = "TEXT")
    private String widgetsJson;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Map<String, String> getLayout() { return layout; }
    public void setLayout(Map<String, String> layout) { this.layout = layout; }
    
    public String getWidgetsJson() { return widgetsJson; }
    public void setWidgetsJson(String widgetsJson) { this.widgetsJson = widgetsJson; }
}

