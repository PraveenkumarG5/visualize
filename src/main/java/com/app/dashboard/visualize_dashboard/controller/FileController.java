package com.app.dashboard.visualize_dashboard.controller;

import com.app.dashboard.visualize_dashboard.model.dto.FileUploadRequest;
import com.app.dashboard.visualize_dashboard.model.dto.FileValidationResponse;
import com.app.dashboard.visualize_dashboard.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {
    
    private final FileService fileService;
    
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }
    
    @PostMapping("/select")
    public ResponseEntity<Map<String, Object>> selectFolder(@RequestBody FileUploadRequest request) {
        Map<String, Object> result = fileService.selectFolder(request.getPath());
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam("openFile") MultipartFile openFile,
            @RequestParam("releaseFile") MultipartFile releaseFile) {
        Map<String, Object> result = fileService.uploadFiles(openFile, releaseFile);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/validate")
    public ResponseEntity<FileValidationResponse> validateFile(
            @RequestParam String type) {
        FileValidationResponse response = fileService.validateFile(type);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh() {
        fileService.refresh();
        return ResponseEntity.ok(Map.of("message", "Files refreshed successfully"));
    }
}

