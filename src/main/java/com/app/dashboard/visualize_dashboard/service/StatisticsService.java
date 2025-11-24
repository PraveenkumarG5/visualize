package com.app.dashboard.visualize_dashboard.service;

import com.app.dashboard.visualize_dashboard.model.dto.StatisticsResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {
    
    private final FileService fileService;
    private final DataAggregationService aggregationService;
    
    public StatisticsService(FileService fileService, DataAggregationService aggregationService) {
        this.fileService = fileService;
        this.aggregationService = aggregationService;
    }
    
    public StatisticsResponse getStatistics() {
        List<Map<String, Object>> openData = fileService.getData("open");
        List<Map<String, Object>> releaseData = fileService.getData("release");
        
        StatisticsResponse stats = new StatisticsResponse();
        
        stats.setTotalOpenRequirements(openData.size());
        stats.setTotalReleases(releaseData.size());
        
        // Distributions
        stats.setLocationDistribution(getDistribution(openData, "Location"));
        stats.setGradeDistribution(getDistribution(openData, "Grade"));
        stats.setPersonTypeDistribution(getDistribution(openData, "Person Type"));
        stats.setStatusDistribution(getDistribution(openData, "Status"));
        
        // Qtr counts
        stats.setQtrCounts(getDistribution(openData, "Qtr"));
        
        // Revenue calculations
        double octRev = sumColumn(openData, "Oct Rev");
        double novRev = sumColumn(openData, "Nov Rev");
        double decRev = sumColumn(openData, "Dec Rev");
        double q3Rev = octRev + novRev + decRev;
        
        stats.setOctRev(octRev);
        stats.setNovRev(novRev);
        stats.setDecRev(decRev);
        stats.setQ3Rev(q3Rev);
        
        return stats;
    }
    
    private Map<String, Long> getDistribution(List<Map<String, Object>> data, String column) {
        return aggregationService.getDistribution(data, column);
    }
    
    private double sumColumn(List<Map<String, Object>> data, String column) {
        return data.stream()
            .mapToDouble(row -> {
                Object value = row.get(column);
                if (value == null) return 0.0;
                if (value instanceof Number) {
                    return ((Number) value).doubleValue();
                }
                try {
                    return Double.parseDouble(value.toString().replaceAll("[^\\d.-]", ""));
                } catch (NumberFormatException e) {
                    return 0.0;
                }
            })
            .sum();
    }
}

