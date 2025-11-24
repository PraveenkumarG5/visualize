package com.app.dashboard.visualize_dashboard.service;

import com.app.dashboard.visualize_dashboard.exception.FileProcessingException;
import com.app.dashboard.visualize_dashboard.model.dto.FileValidationResponse;
import com.app.dashboard.visualize_dashboard.model.entity.SavedFile;
import com.app.dashboard.visualize_dashboard.repository.SavedFileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class FileService {
    
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    
    private final ExcelParsingService excelParsingService;
    private final SavedFileRepository savedFileRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    
    // In-memory cache for parsed data
    private Map<String, List<Map<String, Object>>> dataCache = new HashMap<>();
    private Map<String, List<String>> columnsCache = new HashMap<>();
    
    public FileService(ExcelParsingService excelParsingService, 
                      SavedFileRepository savedFileRepository,
                      ObjectMapper objectMapper) {
        this.excelParsingService = excelParsingService;
        this.savedFileRepository = savedFileRepository;
        this.objectMapper = objectMapper;
    }
    
    public Map<String, Object> selectFolder(String folderPath) {
        logger.info("Selecting folder: {}", folderPath);
        
        Path openReqPath = Paths.get(folderPath, "Open_Requirement_Data.xlsx");
        Path releasePath = Paths.get(folderPath, "Employee_Release_Data.xlsx");
        
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        
        // Validate and load open requirements file
        if (Files.exists(openReqPath)) {
            try {
                loadFile(openReqPath.toString(), "open");
                result.put("openFile", Map.of("exists", true, "path", openReqPath.toString()));
            } catch (Exception e) {
                logger.error("Error loading open requirements file", e);
                errors.add("Error loading Open_Requirement_Data.xlsx: " + e.getMessage());
                result.put("openFile", Map.of("exists", false, "error", e.getMessage()));
            }
        } else {
            errors.add("Open_Requirement_Data.xlsx not found");
            result.put("openFile", Map.of("exists", false));
        }
        
        // Validate and load release file
        if (Files.exists(releasePath)) {
            try {
                loadFile(releasePath.toString(), "release");
                result.put("releaseFile", Map.of("exists", true, "path", releasePath.toString()));
            } catch (Exception e) {
                logger.error("Error loading release file", e);
                errors.add("Error loading Employee_Release_Data.xlsx: " + e.getMessage());
                result.put("releaseFile", Map.of("exists", false, "error", e.getMessage()));
            }
        } else {
            errors.add("Employee_Release_Data.xlsx not found");
            result.put("releaseFile", Map.of("exists", false));
        }
        
        result.put("errors", errors);
        result.put("success", errors.isEmpty());
        
        return result;
    }
    
    public Map<String, Object> uploadFiles(MultipartFile openFile, MultipartFile releaseFile) {
        logger.info("Uploading files");
        
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Map<String, Object> result = new HashMap<>();
            List<String> errors = new ArrayList<>();
            
            // Save and load open requirements file
            if (openFile != null && !openFile.isEmpty()) {
                try {
                    String fileName = "Open_Requirement_Data_" + System.currentTimeMillis() + ".xlsx";
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(openFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    loadFile(filePath.toString(), "open");
                    result.put("openFile", Map.of("exists", true, "path", filePath.toString(), "name", fileName));
                } catch (Exception e) {
                    logger.error("Error uploading open requirements file", e);
                    errors.add("Error uploading open file: " + e.getMessage());
                    result.put("openFile", Map.of("exists", false, "error", e.getMessage()));
                }
            } else {
                errors.add("Open requirements file is required");
                result.put("openFile", Map.of("exists", false));
            }
            
            // Save and load release file
            if (releaseFile != null && !releaseFile.isEmpty()) {
                try {
                    String fileName = "Employee_Release_Data_" + System.currentTimeMillis() + ".xlsx";
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(releaseFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    loadFile(filePath.toString(), "release");
                    result.put("releaseFile", Map.of("exists", true, "path", filePath.toString(), "name", fileName));
                } catch (Exception e) {
                    logger.error("Error uploading release file", e);
                    errors.add("Error uploading release file: " + e.getMessage());
                    result.put("releaseFile", Map.of("exists", false, "error", e.getMessage()));
                }
            } else {
                errors.add("Release file is required");
                result.put("releaseFile", Map.of("exists", false));
            }
            
            result.put("errors", errors);
            result.put("success", errors.isEmpty());
            
            return result;
        } catch (IOException e) {
            throw new FileProcessingException("Failed to create upload directory", e);
        }
    }
    
    private void loadFile(String filePath, String fileType) throws IOException {
        logger.info("Loading file: {} as type: {}", filePath, fileType);
        
        Map<String, Object> parsed = excelParsingService.parseExcelFile(filePath);
        
        @SuppressWarnings("unchecked")
        List<String> columns = (List<String>) parsed.get("columns");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) parsed.get("rows");
        
        // Update cache
        dataCache.put(fileType, rows);
        columnsCache.put(fileType, columns);
        
        // Save to database
        SavedFile savedFile = savedFileRepository.findByFileType(fileType)
            .orElse(new SavedFile());
        savedFile.setFileType(fileType);
        savedFile.setFilePath(filePath);
        savedFile.setFileName(new File(filePath).getName());
        savedFile.setColumnList(columns);
        try {
            savedFile.setColumnsJson(objectMapper.writeValueAsString(columns));
        } catch (Exception e) {
            logger.warn("Failed to serialize columns to JSON", e);
        }
        
        savedFileRepository.save(savedFile);
        
        logger.info("Loaded {} rows from {}", rows.size(), filePath);
    }
    
    public FileValidationResponse validateFile(String type) {
        List<String> columns = columnsCache.get(type);
        boolean exists = columns != null && !columns.isEmpty();
        
        return new FileValidationResponse(
            exists,
            exists ? columns : Collections.emptyList(),
            exists ? "File loaded successfully" : "File not loaded"
        );
    }
    
    public List<Map<String, Object>> getData(String type) {
        return dataCache.getOrDefault(type, Collections.emptyList());
    }
    
    public List<String> getColumns(String type) {
        return columnsCache.getOrDefault(type, Collections.emptyList());
    }
    
    public void refresh() {
        logger.info("Refreshing all files");
        dataCache.clear();
        columnsCache.clear();
        
        savedFileRepository.findAll().forEach(savedFile -> {
            try {
                if (savedFile.getFilePath() != null && Files.exists(Paths.get(savedFile.getFilePath()))) {
                    loadFile(savedFile.getFilePath(), savedFile.getFileType());
                }
            } catch (Exception e) {
                logger.error("Error refreshing file: {}", savedFile.getFilePath(), e);
            }
        });
    }
    
    public boolean isDataLoaded() {
        return !dataCache.isEmpty() && dataCache.containsKey("open") && dataCache.containsKey("release");
    }
}

