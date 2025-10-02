"""
Enterprise Analytics Dashboard

This module provides comprehensive analytics and monitoring capabilities for
enterprise AI systems, including performance metrics, usage analytics,
and business intelligence dashboards.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger(__name__)


class MetricType(Enum):
    """Types of metrics"""
    PERFORMANCE = "performance"
    USAGE = "usage"
    BUSINESS = "business"
    SECURITY = "security"
    COMPLIANCE = "compliance"


class TimeGranularity(Enum):
    """Time granularity for analytics"""
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


@dataclass
class MetricDataPoint:
    """Individual metric data point"""
    timestamp: datetime
    value: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class DashboardWidget:
    """Dashboard widget configuration"""
    widget_id: str
    title: str
    metric_type: MetricType
    chart_type: str
    time_range: Tuple[datetime, datetime]
    granularity: TimeGranularity
    filters: Dict[str, Any] = field(default_factory=dict)
    config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AnalyticsReport:
    """Analytics report"""
    report_id: str
    title: str
    description: str
    metrics: List[str]
    time_range: Tuple[datetime, datetime]
    generated_at: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    insights: List[str] = field(default_factory=list)


class EnterpriseAnalyticsDashboard:
    """
    Enterprise Analytics Dashboard
    
    Provides comprehensive analytics and monitoring for enterprise AI systems
    with real-time metrics, business intelligence, and performance insights.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.metrics: Dict[str, List[MetricDataPoint]] = {}
        self.dashboards: Dict[str, List[DashboardWidget]] = {}
        self.reports: Dict[str, AnalyticsReport] = {}
        self.alerts: List[Dict[str, Any]] = []
        self._setup_analytics()
    
    def _setup_analytics(self):
        """Initialize analytics components"""
        # Initialize default metrics
        self._initialize_default_metrics()
        
        # Setup default dashboards
        self._setup_default_dashboards()
    
    def _initialize_default_metrics(self):
        """Initialize default metric categories"""
        default_metrics = [
            "ai_response_time",
            "ai_accuracy",
            "user_satisfaction",
            "system_uptime",
            "api_requests",
            "error_rate",
            "security_events",
            "compliance_score"
        ]
        
        for metric in default_metrics:
            self.metrics[metric] = []
    
    def _setup_default_dashboards(self):
        """Setup default dashboard configurations"""
        # Performance Dashboard
        performance_widgets = [
            DashboardWidget(
                widget_id="response_time",
                title="AI Response Time",
                metric_type=MetricType.PERFORMANCE,
                chart_type="line",
                time_range=(datetime.now() - timedelta(days=7), datetime.now()),
                granularity=TimeGranularity.HOUR
            ),
            DashboardWidget(
                widget_id="accuracy",
                title="AI Accuracy",
                metric_type=MetricType.PERFORMANCE,
                chart_type="gauge",
                time_range=(datetime.now() - timedelta(days=1), datetime.now()),
                granularity=TimeGranularity.HOUR
            )
        ]
        self.dashboards["performance"] = performance_widgets
        
        # Usage Dashboard
        usage_widgets = [
            DashboardWidget(
                widget_id="api_requests",
                title="API Requests",
                metric_type=MetricType.USAGE,
                chart_type="bar",
                time_range=(datetime.now() - timedelta(days=30), datetime.now()),
                granularity=TimeGranularity.DAY
            ),
            DashboardWidget(
                widget_id="user_activity",
                title="User Activity",
                metric_type=MetricType.USAGE,
                chart_type="heatmap",
                time_range=(datetime.now() - timedelta(days=7), datetime.now()),
                granularity=TimeGranularity.HOUR
            )
        ]
        self.dashboards["usage"] = usage_widgets
    
    async def record_metric(
        self,
        metric_name: str,
        value: float,
        timestamp: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Record a metric data point
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            timestamp: Timestamp (defaults to now)
            metadata: Optional metadata
            tags: Optional tags
            
        Returns:
            Success status
        """
        try:
            if metric_name not in self.metrics:
                self.metrics[metric_name] = []
            
            data_point = MetricDataPoint(
                timestamp=timestamp or datetime.now(),
                value=value,
                metadata=metadata or {},
                tags=tags or {}
            )
            
            self.metrics[metric_name].append(data_point)
            
            # Keep only last 10000 data points per metric
            if len(self.metrics[metric_name]) > 10000:
                self.metrics[metric_name] = self.metrics[metric_name][-10000:]
            
            # Check for alerts
            await self._check_alerts(metric_name, value, data_point)
            
            logger.info(f"Metric recorded: {metric_name} = {value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record metric {metric_name}", error=str(e))
            return False
    
    async def _check_alerts(self, metric_name: str, value: float, data_point: MetricDataPoint):
        """Check if metric value triggers any alerts"""
        for alert in self.alerts:
            if alert["metric"] == metric_name and alert["active"]:
                if self._evaluate_alert_condition(alert, value, data_point):
                    await self._trigger_alert(alert, value, data_point)
    
    def _evaluate_alert_condition(self, alert: Dict[str, Any], value: float, data_point: MetricDataPoint) -> bool:
        """Evaluate if alert condition is met"""
        condition = alert.get("condition", {})
        operator = condition.get("operator")
        threshold = condition.get("threshold")
        
        if operator == "greater_than":
            return value > threshold
        elif operator == "less_than":
            return value < threshold
        elif operator == "equals":
            return value == threshold
        elif operator == "not_equals":
            return value != threshold
        
        return False
    
    async def _trigger_alert(self, alert: Dict[str, Any], value: float, data_point: MetricDataPoint):
        """Trigger an alert"""
        alert_data = {
            "alert_id": alert["alert_id"],
            "metric": alert["metric"],
            "value": value,
            "threshold": alert["condition"]["threshold"],
            "timestamp": data_point.timestamp,
            "message": alert.get("message", f"Alert triggered for {alert['metric']}")
        }
        
        logger.warning("Alert triggered", **alert_data)
        
        # In production, send notifications (email, Slack, etc.)
    
    async def get_metric_data(
        self,
        metric_name: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        granularity: TimeGranularity = TimeGranularity.HOUR,
        aggregation: str = "mean"
    ) -> List[MetricDataPoint]:
        """
        Get metric data with optional filtering and aggregation
        
        Args:
            metric_name: Name of the metric
            start_time: Start time filter
            end_time: End time filter
            granularity: Time granularity for aggregation
            aggregation: Aggregation method (mean, sum, max, min)
            
        Returns:
            List of metric data points
        """
        if metric_name not in self.metrics:
            return []
        
        data_points = self.metrics[metric_name]
        
        # Apply time filters
        if start_time:
            data_points = [dp for dp in data_points if dp.timestamp >= start_time]
        if end_time:
            data_points = [dp for dp in data_points if dp.timestamp <= end_time]
        
        # Apply aggregation
        if aggregation != "raw":
            data_points = self._aggregate_data_points(data_points, granularity, aggregation)
        
        return data_points
    
    def _aggregate_data_points(
        self, 
        data_points: List[MetricDataPoint], 
        granularity: TimeGranularity, 
        aggregation: str
    ) -> List[MetricDataPoint]:
        """Aggregate data points by time granularity"""
        if not data_points:
            return []
        
        # Group by time buckets
        time_buckets = {}
        for dp in data_points:
            bucket_time = self._get_time_bucket(dp.timestamp, granularity)
            if bucket_time not in time_buckets:
                time_buckets[bucket_time] = []
            time_buckets[bucket_time].append(dp)
        
        # Aggregate each bucket
        aggregated_points = []
        for bucket_time, bucket_points in time_buckets.items():
            values = [dp.value for dp in bucket_points]
            
            if aggregation == "mean":
                aggregated_value = np.mean(values)
            elif aggregation == "sum":
                aggregated_value = np.sum(values)
            elif aggregation == "max":
                aggregated_value = np.max(values)
            elif aggregation == "min":
                aggregated_value = np.min(values)
            else:
                aggregated_value = np.mean(values)
            
            aggregated_point = MetricDataPoint(
                timestamp=bucket_time,
                value=aggregated_value,
                metadata={"aggregation": aggregation, "count": len(bucket_points)},
                tags=bucket_points[0].tags if bucket_points else {}
            )
            aggregated_points.append(aggregated_point)
        
        return sorted(aggregated_points, key=lambda x: x.timestamp)
    
    def _get_time_bucket(self, timestamp: datetime, granularity: TimeGranularity) -> datetime:
        """Get time bucket for given granularity"""
        if granularity == TimeGranularity.HOUR:
            return timestamp.replace(minute=0, second=0, microsecond=0)
        elif granularity == TimeGranularity.DAY:
            return timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        elif granularity == TimeGranularity.WEEK:
            # Get start of week (Monday)
            days_since_monday = timestamp.weekday()
            return (timestamp - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif granularity == TimeGranularity.MONTH:
            return timestamp.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif granularity == TimeGranularity.QUARTER:
            quarter = (timestamp.month - 1) // 3 + 1
            return timestamp.replace(month=(quarter - 1) * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        elif granularity == TimeGranularity.YEAR:
            return timestamp.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            return timestamp
    
    async def create_dashboard(
        self,
        dashboard_name: str,
        widgets: List[DashboardWidget]
    ) -> bool:
        """
        Create a new dashboard
        
        Args:
            dashboard_name: Name of the dashboard
            widgets: List of dashboard widgets
            
        Returns:
            Success status
        """
        try:
            self.dashboards[dashboard_name] = widgets
            logger.info(f"Dashboard '{dashboard_name}' created with {len(widgets)} widgets")
            return True
        except Exception as e:
            logger.error(f"Failed to create dashboard '{dashboard_name}'", error=str(e))
            return False
    
    async def get_dashboard_data(
        self,
        dashboard_name: str,
        time_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """
        Get dashboard data
        
        Args:
            dashboard_name: Name of the dashboard
            time_range: Optional time range override
            
        Returns:
            Dashboard data
        """
        if dashboard_name not in self.dashboards:
            return {}
        
        widgets = self.dashboards[dashboard_name]
        dashboard_data = {
            "dashboard_name": dashboard_name,
            "widgets": []
        }
        
        for widget in widgets:
            widget_time_range = time_range or widget.time_range
            
            # Get metric data for widget
            metric_data = await self.get_metric_data(
                metric_name=widget.widget_id,
                start_time=widget_time_range[0],
                end_time=widget_time_range[1],
                granularity=widget.granularity
            )
            
            widget_data = {
                "widget_id": widget.widget_id,
                "title": widget.title,
                "chart_type": widget.chart_type,
                "data": [
                    {
                        "timestamp": dp.timestamp.isoformat(),
                        "value": dp.value,
                        "metadata": dp.metadata
                    }
                    for dp in metric_data
                ]
            }
            
            dashboard_data["widgets"].append(widget_data)
        
        return dashboard_data
    
    async def generate_report(
        self,
        report_name: str,
        metrics: List[str],
        time_range: Tuple[datetime, datetime],
        title: str = "",
        description: str = ""
    ) -> AnalyticsReport:
        """
        Generate an analytics report
        
        Args:
            report_name: Name of the report
            metrics: List of metrics to include
            time_range: Time range for the report
            title: Report title
            description: Report description
            
        Returns:
            Generated report
        """
        try:
            report_data = {}
            insights = []
            
            # Collect data for each metric
            for metric in metrics:
                metric_data = await self.get_metric_data(
                    metric_name=metric,
                    start_time=time_range[0],
                    end_time=time_range[1],
                    granularity=TimeGranularity.DAY
                )
                
                if metric_data:
                    values = [dp.value for dp in metric_data]
                    report_data[metric] = {
                        "data": metric_data,
                        "summary": {
                            "mean": np.mean(values),
                            "median": np.median(values),
                            "min": np.min(values),
                            "max": np.max(values),
                            "std": np.std(values),
                            "count": len(values)
                        }
                    }
                    
                    # Generate insights
                    insight = self._generate_metric_insight(metric, values, metric_data)
                    if insight:
                        insights.append(insight)
            
            # Generate overall insights
            overall_insights = self._generate_overall_insights(report_data, time_range)
            insights.extend(overall_insights)
            
            report = AnalyticsReport(
                report_id=f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                title=title or f"Analytics Report - {report_name}",
                description=description or f"Report for {', '.join(metrics)}",
                metrics=metrics,
                time_range=time_range,
                generated_at=datetime.now(),
                data=report_data,
                insights=insights
            )
            
            self.reports[report.report_id] = report
            
            logger.info(f"Report generated: {report.report_id}")
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate report '{report_name}'", error=str(e))
            raise
    
    def _generate_metric_insight(self, metric: str, values: List[float], data_points: List[MetricDataPoint]) -> Optional[str]:
        """Generate insight for a specific metric"""
        if not values:
            return None
        
        mean_value = np.mean(values)
        std_value = np.std(values)
        
        # Trend analysis
        if len(values) >= 2:
            trend = "increasing" if values[-1] > values[0] else "decreasing"
            trend_strength = abs(values[-1] - values[0]) / mean_value if mean_value > 0 else 0
            
            if trend_strength > 0.1:  # 10% change
                return f"{metric} shows {trend} trend with {trend_strength:.1%} change"
        
        # Anomaly detection
        if std_value > 0:
            z_scores = [(v - mean_value) / std_value for v in values]
            anomalies = [i for i, z in enumerate(z_scores) if abs(z) > 2]
            
            if anomalies:
                return f"{metric} has {len(anomalies)} potential anomalies"
        
        # Performance insights
        if metric == "ai_response_time" and mean_value > 2.0:
            return f"AI response time is high at {mean_value:.2f}s average"
        elif metric == "ai_accuracy" and mean_value < 0.8:
            return f"AI accuracy is below target at {mean_value:.1%}"
        elif metric == "error_rate" and mean_value > 0.05:
            return f"Error rate is elevated at {mean_value:.1%}"
        
        return None
    
    def _generate_overall_insights(self, report_data: Dict[str, Any], time_range: Tuple[datetime, datetime]) -> List[str]:
        """Generate overall insights from report data"""
        insights = []
        
        # System health insight
        if "system_uptime" in report_data:
            uptime_data = report_data["system_uptime"]["data"]
            if uptime_data:
                uptime_values = [dp.value for dp in uptime_data]
                avg_uptime = np.mean(uptime_values)
                if avg_uptime < 0.99:  # 99% uptime
                    insights.append(f"System uptime is below target at {avg_uptime:.1%}")
        
        # Performance correlation
        if "ai_response_time" in report_data and "ai_accuracy" in report_data:
            response_times = [dp.value for dp in report_data["ai_response_time"]["data"]]
            accuracy_values = [dp.value for dp in report_data["ai_accuracy"]["data"]]
            
            if len(response_times) == len(accuracy_values) and len(response_times) > 1:
                correlation = np.corrcoef(response_times, accuracy_values)[0, 1]
                if abs(correlation) > 0.5:
                    direction = "positive" if correlation > 0 else "negative"
                    insights.append(f"Strong {direction} correlation between response time and accuracy")
        
        # Usage patterns
        if "api_requests" in report_data:
            requests_data = report_data["api_requests"]["data"]
            if requests_data:
                request_values = [dp.value for dp in requests_data]
                total_requests = np.sum(request_values)
                insights.append(f"Total API requests: {total_requests:,.0f}")
        
        return insights
    
    async def setup_alert(
        self,
        alert_id: str,
        metric: str,
        condition: Dict[str, Any],
        message: str = "",
        active: bool = True
    ) -> bool:
        """
        Setup a metric alert
        
        Args:
            alert_id: Unique alert identifier
            metric: Metric to monitor
            condition: Alert condition (operator, threshold)
            message: Alert message
            active: Whether alert is active
            
        Returns:
            Success status
        """
        try:
            alert = {
                "alert_id": alert_id,
                "metric": metric,
                "condition": condition,
                "message": message,
                "active": active,
                "created_at": datetime.now()
            }
            
            self.alerts.append(alert)
            logger.info(f"Alert setup: {alert_id} for {metric}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup alert {alert_id}", error=str(e))
            return False
    
    def get_analytics_summary(self) -> Dict[str, Any]:
        """Get analytics system summary"""
        total_metrics = len(self.metrics)
        total_data_points = sum(len(data) for data in self.metrics.values())
        total_dashboards = len(self.dashboards)
        total_reports = len(self.reports)
        active_alerts = len([a for a in self.alerts if a["active"]])
        
        return {
            "total_metrics": total_metrics,
            "total_data_points": total_data_points,
            "total_dashboards": total_dashboards,
            "total_reports": total_reports,
            "active_alerts": active_alerts,
            "metrics": list(self.metrics.keys()),
            "dashboards": list(self.dashboards.keys())
        }


# Example usage and testing
async def main():
    """Example usage of the Enterprise Analytics Dashboard"""
    config = {}
    
    analytics = EnterpriseAnalyticsDashboard(config)
    
    # Record some sample metrics
    await analytics.record_metric("ai_response_time", 1.5, metadata={"model": "gpt-4"})
    await analytics.record_metric("ai_accuracy", 0.85, metadata={"model": "gpt-4"})
    await analytics.record_metric("api_requests", 100, tags={"endpoint": "/api/chat"})
    
    # Setup an alert
    await analytics.setup_alert(
        alert_id="high_response_time",
        metric="ai_response_time",
        condition={"operator": "greater_than", "threshold": 3.0},
        message="AI response time is too high"
    )
    
    # Get metric data
    response_time_data = await analytics.get_metric_data(
        "ai_response_time",
        granularity=TimeGranularity.HOUR
    )
    print(f"Response time data points: {len(response_time_data)}")
    
    # Generate a report
    report = await analytics.generate_report(
        report_name="performance_report",
        metrics=["ai_response_time", "ai_accuracy", "api_requests"],
        time_range=(datetime.now() - timedelta(days=7), datetime.now()),
        title="Weekly Performance Report",
        description="Analysis of AI system performance over the past week"
    )
    
    print(f"Report generated: {report.report_id}")
    print(f"Insights: {report.insights}")
    
    # Get dashboard data
    dashboard_data = await analytics.get_dashboard_data("performance")
    print(f"Dashboard widgets: {len(dashboard_data.get('widgets', []))}")
    
    # Get analytics summary
    summary = analytics.get_analytics_summary()
    print(f"Analytics summary: {summary}")


if __name__ == "__main__":
    asyncio.run(main())
