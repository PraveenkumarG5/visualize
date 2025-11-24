package com.app.dashboard.visualize_dashboard.controller;

import com.app.dashboard.visualize_dashboard.model.dto.WidgetConfig;
import com.app.dashboard.visualize_dashboard.model.dto.WidgetPreviewResponse;
import com.app.dashboard.visualize_dashboard.service.WidgetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/widgets")
@CrossOrigin(origins = "*")
public class WidgetController {
    
    private final WidgetService widgetService;
    
    public WidgetController(WidgetService widgetService) {
        this.widgetService = widgetService;
    }
    
    @PostMapping("/preview")
    public ResponseEntity<WidgetPreviewResponse> previewWidget(@RequestBody WidgetConfig config) {
        WidgetPreviewResponse response = widgetService.previewWidget(config);
        return ResponseEntity.ok(response);
    }
}

