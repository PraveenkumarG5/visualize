package com.app.dashboard.visualize_dashboard.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.IOUtils;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class ExcelParsingService {
    
    private static final Logger logger = LoggerFactory.getLogger(ExcelParsingService.class);

    // Set a higher override value for the byte array maximum size
    static {
        IOUtils.setByteArrayMaxOverride(400000000);
    }
    
    public Map<String, Object> parseExcelFile(String filePath) throws IOException {
        logger.info("Parsing Excel file: {}", filePath);
        try (FileInputStream fis = new FileInputStream(filePath);
             Workbook workbook = new XSSFWorkbook(fis)) {
            return parseWorkbook(workbook);
        }
    }
    
    public Map<String, Object> parseExcelFile(InputStream inputStream) throws IOException {
        logger.info("Parsing Excel file from input stream");
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            return parseWorkbook(workbook);
        }
    }
    
    private Map<String, Object> parseWorkbook(Workbook workbook) {
        // To prevent memory issues, remove all sheets except the first one
        for (int i = workbook.getNumberOfSheets() - 1; i > 0; i--) {
            workbook.removeSheetAt(i);
        }

        Sheet sheet = workbook.getSheetAt(0);
        List<String> columns = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        
        // Read header row
        Row headerRow = sheet.getRow(0);
        if (headerRow != null) {
            for (Cell cell : headerRow) {
                String columnName = getCellValueAsString(cell).trim();
                if (!columnName.isEmpty()) {
                    columns.add(columnName);
                }
            }
        }
        
        // Read data rows
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            Map<String, Object> rowData = new LinkedHashMap<>();
            for (int j = 0; j < columns.size(); j++) {
                Cell cell = row.getCell(j);
                Object value = getCellValue(cell);
                rowData.put(columns.get(j), value);
            }
            rows.add(rowData);
        }
        
        logger.info("Parsed {} rows with {} columns from the first sheet", rows.size(), columns.size());
        
        Map<String, Object> result = new HashMap<>();
        result.put("columns", columns);
        result.put("rows", rows);
        return result;
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                } else {
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        yield String.valueOf((long) numValue);
                    } else {
                        yield String.valueOf(numValue);
                    }
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.getCellFormula();
                }
            }
            default -> "";
        };
    }
    
    private Object getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue();
                } else {
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        yield (long) numValue;
                    } else {
                        yield numValue;
                    }
                }
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            case FORMULA -> {
                try {
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        yield (long) numValue;
                    } else {
                        yield numValue;
                    }
                } catch (Exception e) {
                    yield cell.getCellFormula();
                }
            }
            default -> "";
        };
    }
}

