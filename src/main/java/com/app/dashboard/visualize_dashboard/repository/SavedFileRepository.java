package com.app.dashboard.visualize_dashboard.repository;

import com.app.dashboard.visualize_dashboard.model.entity.SavedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedFileRepository extends JpaRepository<SavedFile, String> {
    Optional<SavedFile> findByFileType(String fileType);
}

