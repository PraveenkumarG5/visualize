package com.app.dashboard.visualize_dashboard.controller;

import com.app.dashboard.visualize_dashboard.model.dto.DashboardRequest;
import com.app.dashboard.visualize_dashboard.model.dto.DashboardResponse;
import com.app.dashboard.visualize_dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboards")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }
    
    @PostMapping
    public ResponseEntity<DashboardResponse> saveDashboard(@RequestBody DashboardRequest request) {
        DashboardResponse response = dashboardService.saveDashboard(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<DashboardResponse>> listDashboards() {
        List<DashboardResponse> dashboards = dashboardService.listDashboards();
        return ResponseEntity.ok(dashboards);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable String id) {
        DashboardResponse dashboard = dashboardService.getDashboard(id);
        return ResponseEntity.ok(dashboard);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable String id) {
        dashboardService.deleteDashboard(id);
        return ResponseEntity.noContent().build();
    }
}

