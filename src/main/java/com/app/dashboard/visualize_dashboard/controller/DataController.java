package com.app.dashboard.visualize_dashboard.controller;

import com.app.dashboard.visualize_dashboard.model.dto.AggregateRequest;
import com.app.dashboard.visualize_dashboard.model.dto.AggregateResponse;
import com.app.dashboard.visualize_dashboard.model.dto.SampleDataResponse;
import com.app.dashboard.visualize_dashboard.model.dto.StatisticsResponse;
import com.app.dashboard.visualize_dashboard.service.DataAggregationService;
import com.app.dashboard.visualize_dashboard.service.FileService;
import com.app.dashboard.visualize_dashboard.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*")
public class DataController {
    
    private final FileService fileService;
    private final StatisticsService statisticsService;
    private final DataAggregationService aggregationService;
    
    public DataController(FileService fileService, 
                         StatisticsService statisticsService,
                         DataAggregationService aggregationService) {
        this.fileService = fileService;
        this.statisticsService = statisticsService;
        this.aggregationService = aggregationService;
    }
    
    @GetMapping("/sample")
    public ResponseEntity<SampleDataResponse> getSampleData(
            @RequestParam String type,
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> allData = fileService.getData(type);
        List<Map<String, Object>> sampleData = allData.stream()
            .limit(limit)
            .collect(Collectors.toList());
        
        SampleDataResponse response = new SampleDataResponse(
            fileService.getColumns(type),
            sampleData
        );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponse> getStatistics() {
        StatisticsResponse stats = statisticsService.getStatistics();
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/aggregate")
    public ResponseEntity<AggregateResponse> aggregate(@RequestBody AggregateRequest request) {
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
        
        return ResponseEntity.ok(response);
    }
}

