package com.app.dashboard.visualize_dashboard.repository;

import com.app.dashboard.visualize_dashboard.model.entity.Dashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, String> {
    List<Dashboard> findByUser(String user);
    List<Dashboard> findByNameContainingIgnoreCase(String name);
}

