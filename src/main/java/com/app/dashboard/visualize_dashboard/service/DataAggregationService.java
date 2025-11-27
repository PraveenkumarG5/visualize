package com.app.dashboard.visualize_dashboard.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.DateUtil;

@Service
public class DataAggregationService {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DataAggregationService.class);

    
    public Map<String, Object> aggregate(List<Map<String, Object>> data, 
                                         List<String> groupBy, 
                                         String operation,
                                         String valueColumn) {
        if ("revenue_loss".equalsIgnoreCase(operation)) {
            return calculateRevenueLoss(data, groupBy);
        }

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
            return Double.parseDouble(value.toString().replaceAll("[^0-9.-]", ""));
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
                    
                    if (filterValue instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Object> filterValues = (List<Object>) filterValue;
                        if (filterValues.stream().noneMatch(v -> v.toString().equalsIgnoreCase(rowValue.toString()))) {
                            return false;
                        }
                    } else {
                        if (!rowValue.toString().equalsIgnoreCase(filterValue.toString())) {
                            return false;
                        }
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

    public List<Object> getUniqueValues(List<Map<String, Object>> data, String column) {
        if (data == null || data.isEmpty() || column == null || column.isEmpty()) {
            return Collections.emptyList();
        }

        return data.stream()
                .map(row -> row.get(column))
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        DateTimeFormatter.ofPattern("M/d/yy"),
        DateTimeFormatter.ofPattern("MM/dd/yy"),
        DateTimeFormatter.ofPattern("M/d/yyyy"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("d-M-yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("d-MMM-yy", Locale.ENGLISH)
    );

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        String trimmedDateStr = dateStr.trim();

        // 1. Try to parse as a numeric Excel date
        try {
            double excelDate = Double.parseDouble(trimmedDateStr);
            java.util.Date utilDate = DateUtil.getJavaDate(excelDate);
            return utilDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        } catch (NumberFormatException e) {
            // Not a number, fall through to string parsing
        }

        // 2. Try to parse using string formatters
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(trimmedDateStr, formatter);
            } catch (DateTimeParseException e) {
                // Try the next format
            }
        }
        return null; // Return null if all formats fail
    }

    private Map<String, Object> calculateRevenueLoss(List<Map<String, Object>> data, List<String> groupBy) {
        if (data == null || data.isEmpty()) {
            return Map.of("labels", List.of(), "values", List.of());
        }

        List<Integer> invalidRowNumbers = new ArrayList<>();

        // Handle no grouping - calculate total loss
        if (groupBy == null || groupBy.isEmpty() || groupBy.get(0).isEmpty()) {
            double totalLoss = 0.0;
            for (Map<String, Object> row : data) {
                totalLoss += calculateRowLoss(row, invalidRowNumbers);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("labels", List.of("Total Revenue Loss"));
            result.put("values", List.of(totalLoss));
            addWarningIfNecessary(result, invalidRowNumbers);
            return result;
        }

        // Handle grouping
        Map<String, List<Map<String, Object>>> groupedData = data.stream()
            .collect(Collectors.groupingBy(row -> 
                groupBy.stream()
                       .map(col -> String.valueOf(row.getOrDefault(col, "N/A")))
                       .collect(Collectors.joining(" - "))
            ));

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        groupedData.forEach((group, rows) -> {
            double totalLoss = 0.0;
            for (Map<String, Object> row : rows) {
                totalLoss += calculateRowLoss(row, invalidRowNumbers);
            }
            labels.add(group);
            values.add(totalLoss);
        });

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("values", values);
        addWarningIfNecessary(result, invalidRowNumbers);
        return result;
    }

    private double calculateRowLoss(Map<String, Object> row, List<Integer> invalidRowNumbers) {
        Object billDateObj = row.get("Expected Billing start date");
        Object billRateObj = row.get("Bill Rate");
        Integer rowNum = (Integer) row.get("__row_number__");

        if (billDateObj == null || billDateObj.toString().trim().isEmpty()) {
            logger.warn("DEBUG: Row {}: 'Expected Billing start date' is empty. Date Value='{}', Bill Rate Value='{}'", rowNum, billDateObj, billRateObj);
            if (rowNum != null) invalidRowNumbers.add(rowNum);
            return 0.0;
        }

        LocalDate startDate = parseDate(billDateObj.toString());

        if (startDate == null) {
            logger.warn("DEBUG: Row {}: Failed to parse date. Date Value='{}', Bill Rate Value='{}'", rowNum, billDateObj, billRateObj);
            if (rowNum != null) invalidRowNumbers.add(rowNum);
            return 0.0;
        }

        if (billRateObj == null || billRateObj.toString().isEmpty()) {
            logger.warn("DEBUG: Row {}: 'Bill Rate' is null or empty. Date Value='{}', Bill Rate Value='{}'", rowNum, billDateObj, billRateObj);
            if (rowNum != null) invalidRowNumbers.add(rowNum);
            return 0.0;
        }

        try {
            double billRate = parseDouble(billRateObj);
            LocalDate today = LocalDate.now();
            
            if (startDate.isBefore(today)) {
                long daysBetween = ChronoUnit.DAYS.between(startDate, today);
                return daysBetween * billRate;
            } else {
                return 0.0; // Date is in the future, no loss yet. Not an error.
            }
        } catch (NumberFormatException e) {
            logger.warn("DEBUG: Row {}: Failed to parse 'Bill Rate' into a number. Date Value='{}', Bill Rate Value='{}'", rowNum, billDateObj, billRateObj);
             if (rowNum != null) {
                invalidRowNumbers.add(rowNum);
            }
        }
        return 0.0;
    }
    
    private void addWarningIfNecessary(Map<String, Object> result, List<Integer> invalidRowNumbers) {
        if (!invalidRowNumbers.isEmpty()) {
            List<Integer> sortedUniqueInvalidRows = invalidRowNumbers.stream().distinct().sorted().collect(Collectors.toList());
            
            String rowNumbersString = sortedUniqueInvalidRows.stream()
                                                       .limit(5)
                                                       .map(String::valueOf)
                                                       .collect(Collectors.joining(", "));
            if (sortedUniqueInvalidRows.size() > 5) {
                rowNumbersString += ", ...";
            }
            
            result.put("warning", "Could not calculate loss for " + sortedUniqueInvalidRows.size() + " row(s). " +
                                "Data is missing or invalid for rows: " + rowNumbersString);
            result.put("invalidRowNumbers", sortedUniqueInvalidRows);
        }
    }
}