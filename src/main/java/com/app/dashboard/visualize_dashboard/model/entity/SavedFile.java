package com.app.dashboard.visualize_dashboard.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "saved_files")
public class SavedFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "file_type", nullable = false)
    private String fileType; // "open" or "release"
    
    @Column(name = "file_path")
    private String filePath;
    
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;
    
    @ElementCollection
    @CollectionTable(name = "file_columns", joinColumns = @JoinColumn(name = "file_id"))
    @Column(name = "column_name")
    private List<String> columnList;
    
    @Column(columnDefinition = "TEXT")
    private String columnsJson;
    
    @PrePersist
    protected void onCreate() {
        lastReadAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
    
    public List<String> getColumnList() { return columnList; }
    public void setColumnList(List<String> columnList) { this.columnList = columnList; }
    
    public String getColumnsJson() { return columnsJson; }
    public void setColumnsJson(String columnsJson) { this.columnsJson = columnsJson; }
}

