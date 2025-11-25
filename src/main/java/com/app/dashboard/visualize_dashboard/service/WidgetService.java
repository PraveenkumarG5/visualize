package com.app.dashboard.visualize_dashboard.service;

import com.app.dashboard.visualize_dashboard.model.dto.AggregateRequest;
import com.app.dashboard.visualize_dashboard.model.dto.AggregateResponse;
import com.app.dashboard.visualize_dashboard.model.dto.WidgetConfig;
import com.app.dashboard.visualize_dashboard.model.dto.WidgetPreviewResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class WidgetService {
    
    private final FileService fileService;
    private final DataAggregationService aggregationService;
    
    public WidgetService(FileService fileService, DataAggregationService aggregationService) {
        this.fileService = fileService;
        this.aggregationService = aggregationService;
    }
    
    public WidgetPreviewResponse previewWidget(WidgetConfig config) {
        // Get data based on data source
        List<Map<String, Object>> data = fileService.getData(config.getDataSource());
        
        // Apply filters
        List<Map<String, Object>> filteredData = aggregationService.filter(data, config.getFilters());
        
        // Aggregate
        Map<String, Object> aggregated = aggregationService.aggregate(
            filteredData,
            config.getGroupBy(),
            config.getOperation() != null ? config.getOperation() : "count",
            config.getValueColumn()
        );
        
        WidgetPreviewResponse response = new WidgetPreviewResponse();
        
        if (aggregated.containsKey("value")) {
            response.setValues(List.of(aggregated.get("value")));
            response.setLabels(List.of("Value"));
        } else {
            @SuppressWarnings("unchecked")
            List<String> labels = (List<String>) aggregated.get("labels");
            @SuppressWarnings("unchecked")
            List<Object> values = (List<Object>) aggregated.get("values");
            
            response.setLabels(labels != null ? labels : List.of());
            response.setValues(values != null ? values : List.of());
        }
        
        response.setRawData(filteredData);
        
        return response;
    }
    
    public AggregateResponse aggregate(AggregateRequest request) {
        List<Map<String, Object>> data = fileService.getData(request.getType());
        List<Map<String, Object>> filteredData = aggregationService.filter(data, request.getFilters());
        
        Map<String, Object> aggregated = aggregationService.aggregate(
            filteredData,
            request.getGroupBy(),
            request.getOperation() != null ? request.getOperation() : "count",
            request.getValueColumn()
        );
        
        AggregateResponse response = new AggregateResponse();
        
        @SuppressWarnings("unchecked")
        List<String> labels = (List<String>) aggregated.get("labels");
        @SuppressWarnings("unchecked")
        List<Object> values = (List<Object>) aggregated.get("values");
        Object value = aggregated.get("value");
        
        response.setLabels(labels);
        response.setValues(values);
        response.setValue(value);
        
        return response;
    }
}

