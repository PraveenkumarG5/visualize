package com.app.dashboard.visualize_dashboard.service;

import com.app.dashboard.visualize_dashboard.model.dto.DashboardRequest;
import com.app.dashboard.visualize_dashboard.model.dto.DashboardResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DashboardService {
    
    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);
    
    private final ObjectMapper objectMapper;
    private final Path dashboardsDir;
    
    public DashboardService(ObjectMapper objectMapper, 
                           @Value("${file.upload-dir:./uploads}") String uploadDir) {
        this.objectMapper = objectMapper;
        this.dashboardsDir = Paths.get(uploadDir, "dashboards");
        
        // Create dashboards directory if it doesn't exist
        try {
            if (!Files.exists(dashboardsDir)) {
                Files.createDirectories(dashboardsDir);
                logger.info("Created dashboards directory: {}", dashboardsDir);
            }
        } catch (IOException e) {
            logger.error("Failed to create dashboards directory", e);
        }
    }
    
    public DashboardResponse saveDashboard(DashboardRequest request) {
        logger.info("Saving dashboard: {}", request.getName());
        
        try {
            String id = request.getId() != null && !request.getId().isEmpty() 
                ? request.getId() 
                : UUID.randomUUID().toString();
            
            DashboardResponse dashboard = new DashboardResponse();
            dashboard.setId(id);
            dashboard.setName(request.getName());
            dashboard.setUser(request.getUser() != null ? request.getUser() : "admin");
            dashboard.setLayout(request.getLayout());
            dashboard.setWidgets(request.getWidgets() != null ? request.getWidgets() : new ArrayList<>());
            
            // Set timestamps
            Path dashboardFile = dashboardsDir.resolve(id + ".json");
            if (Files.exists(dashboardFile)) {
                // Load existing to preserve createdAt
                try {
                    DashboardResponse existing = objectMapper.readValue(
                        dashboardFile.toFile(), 
                        DashboardResponse.class
                    );
                    dashboard.setCreatedAt(existing.getCreatedAt());
                } catch (Exception e) {
                    logger.warn("Could not load existing dashboard timestamps", e);
                }
            }
            
            if (dashboard.getCreatedAt() == null) {
                dashboard.setCreatedAt(LocalDateTime.now());
            }
            dashboard.setUpdatedAt(LocalDateTime.now());
            
            // Save to file
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(dashboardFile.toFile(), dashboard);
            
            logger.info("Dashboard saved to: {}", dashboardFile);
            return dashboard;
            
        } catch (Exception e) {
            logger.error("Error saving dashboard", e);
            throw new RuntimeException("Failed to save dashboard: " + e.getMessage(), e);
        }
    }
    
    public List<DashboardResponse> listDashboards() {
        try {
            if (!Files.exists(dashboardsDir)) {
                return new ArrayList<>();
            }
            
            try (Stream<Path> paths = Files.list(dashboardsDir)) {
                return paths
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(path -> {
                        try {
                            return objectMapper.readValue(path.toFile(), DashboardResponse.class);
                        } catch (Exception e) {
                            logger.error("Error reading dashboard file: {}", path, e);
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(DashboardResponse::getUpdatedAt).reversed())
                    .collect(Collectors.toList());
            }
        } catch (IOException e) {
            logger.error("Error listing dashboards", e);
            return new ArrayList<>();
        }
    }
    
    public DashboardResponse getDashboard(String id) {
        try {
            Path dashboardFile = dashboardsDir.resolve(id + ".json");
            if (!Files.exists(dashboardFile)) {
                throw new RuntimeException("Dashboard not found: " + id);
            }
            
            return objectMapper.readValue(dashboardFile.toFile(), DashboardResponse.class);
        } catch (Exception e) {
            logger.error("Error loading dashboard: {}", id, e);
            throw new RuntimeException("Failed to load dashboard: " + e.getMessage(), e);
        }
    }
    
    public void deleteDashboard(String id) {
        try {
            Path dashboardFile = dashboardsDir.resolve(id + ".json");
            if (Files.exists(dashboardFile)) {
                Files.delete(dashboardFile);
                logger.info("Deleted dashboard: {}", dashboardFile);
            }
        } catch (IOException e) {
            logger.error("Error deleting dashboard: {}", id, e);
            throw new RuntimeException("Failed to delete dashboard: " + e.getMessage(), e);
        }
    }
}

