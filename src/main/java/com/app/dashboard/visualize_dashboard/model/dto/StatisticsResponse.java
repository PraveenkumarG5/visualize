package com.app.dashboard.visualize_dashboard.model.dto;

import java.util.Map;

public class StatisticsResponse {
    private long totalOpenRequirements;
    private long totalReleases;
    private Map<String, Long> locationDistribution;
    private Map<String, Long> gradeDistribution;
    private Map<String, Long> personTypeDistribution;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> qtrCounts;
    private double octRev;
    private double novRev;
    private double decRev;
    private double q3Rev;
    
    // Getters and Setters
    public long getTotalOpenRequirements() { return totalOpenRequirements; }
    public void setTotalOpenRequirements(long totalOpenRequirements) { this.totalOpenRequirements = totalOpenRequirements; }
    
    public long getTotalReleases() { return totalReleases; }
    public void setTotalReleases(long totalReleases) { this.totalReleases = totalReleases; }
    
    public Map<String, Long> getLocationDistribution() { return locationDistribution; }
    public void setLocationDistribution(Map<String, Long> locationDistribution) { this.locationDistribution = locationDistribution; }
    
    public Map<String, Long> getGradeDistribution() { return gradeDistribution; }
    public void setGradeDistribution(Map<String, Long> gradeDistribution) { this.gradeDistribution = gradeDistribution; }
    
    public Map<String, Long> getPersonTypeDistribution() { return personTypeDistribution; }
    public void setPersonTypeDistribution(Map<String, Long> personTypeDistribution) { this.personTypeDistribution = personTypeDistribution; }
    
    public Map<String, Long> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(Map<String, Long> statusDistribution) { this.statusDistribution = statusDistribution; }
    
    public Map<String, Long> getQtrCounts() { return qtrCounts; }
    public void setQtrCounts(Map<String, Long> qtrCounts) { this.qtrCounts = qtrCounts; }
    
    public double getOctRev() { return octRev; }
    public void setOctRev(double octRev) { this.octRev = octRev; }
    
    public double getNovRev() { return novRev; }
    public void setNovRev(double novRev) { this.novRev = novRev; }
    
    public double getDecRev() { return decRev; }
    public void setDecRev(double decRev) { this.decRev = decRev; }
    
    public double getQ3Rev() { return q3Rev; }
    public void setQ3Rev(double q3Rev) { this.q3Rev = q3Rev; }
}

