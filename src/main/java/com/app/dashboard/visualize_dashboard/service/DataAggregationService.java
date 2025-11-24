package com.app.dashboard.visualize_dashboard.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataAggregationService {
    
    public Map<String, Object> aggregate(List<Map<String, Object>> data, 
                                         List<String> groupBy, 
                                         String operation,
                                         String valueColumn) {
        if (data == null || data.isEmpty()) {
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("labels", Collections.emptyList());
            emptyResult.put("values", Collections.emptyList());
            return emptyResult;
        }
        
        if (groupBy == null || groupBy.isEmpty()) {
            // No grouping - single aggregate value
            Object value = performOperation(data, operation, valueColumn);
            Map<String, Object> result = new HashMap<>();
            result.put("value", value);
            return result;
        }
        
        // Group data
        Map<String, List<Map<String, Object>>> grouped = data.stream()
            .collect(Collectors.groupingBy(row -> {
                return groupBy.stream()
                    .map(col -> String.valueOf(row.getOrDefault(col, "")))
                    .collect(Collectors.joining("|"));
            }));
        
        List<String> labels = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        
        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            String label = entry.getKey().replace("|", " - ");
            if (label.isEmpty()) label = "N/A";
            labels.add(label);
            Object value = performOperation(entry.getValue(), operation, valueColumn);
            values.add(value);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("values", values);
        return result;
    }
    
    private Object performOperation(List<Map<String, Object>> data, 
                                    String operation, 
                                    String valueColumn) {
        if (data.isEmpty()) return 0;
        
        return switch (operation != null ? operation.toLowerCase() : "count") {
            case "count" -> data.size();
            case "sum" -> {
                yield data.stream()
                    .mapToDouble(row -> {
                        Object val = valueColumn != null ? row.get(valueColumn) : 1;
                        return parseDouble(val);
                    })
                    .sum();
            }
            case "avg", "average" -> {
                double sum = data.stream()
                    .mapToDouble(row -> {
                        Object val = valueColumn != null ? row.get(valueColumn) : 1;
                        return parseDouble(val);
                    })
                    .sum();
                yield sum / data.size();
            }
            default -> data.size();
        };
    }
    
    private double parseDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString().replaceAll("[^\\d.-]", ""));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
    
    public List<Map<String, Object>> filter(List<Map<String, Object>> data, 
                                            Map<String, Object> filters) {
        if (filters == null || filters.isEmpty()) {
            return data;
        }
        
        return data.stream()
            .filter(row -> {
                for (Map.Entry<String, Object> filter : filters.entrySet()) {
                    Object rowValue = row.get(filter.getKey());
                    Object filterValue = filter.getValue();
                    
                    if (filterValue == null || filterValue.toString().trim().isEmpty()) {
                        continue; // Skip empty filters
                    }
                    
                    if (rowValue == null) {
                        return false;
                    }
                    
                    if (!rowValue.toString().equalsIgnoreCase(filterValue.toString())) {
                        return false;
                    }
                }
                return true;
            })
            .collect(Collectors.toList());
    }
    
    public Map<String, Long> getDistribution(List<Map<String, Object>> data, String column) {
        return data.stream()
            .collect(Collectors.groupingBy(
                row -> {
                    Object value = row.get(column);
                    return value != null ? value.toString() : "N/A";
                },
                Collectors.counting()
            ));
    }
}

