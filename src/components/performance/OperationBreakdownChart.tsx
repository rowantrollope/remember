"use client"

import React from 'react'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import type { PerformanceMetricsResponse } from '@/lib/api'

ChartJS.register(ArcElement, Tooltip, Legend)

interface OperationBreakdownChartProps {
    metrics: PerformanceMetricsResponse
}

export function OperationBreakdownChart({ metrics }: OperationBreakdownChartProps) {
    // Generate operation metrics from cache stats if not available
    const operationMetrics = metrics.operation_metrics || (metrics.performance_metrics?.cache_stats ? [{
        operation_type: 'cache_operations',
        hit_rate: metrics.performance_metrics.cache_stats.hit_rate_percent || 0,
        hits: metrics.performance_metrics.cache_stats.semantic_hits || metrics.performance_metrics.cache_stats.hits || 0,
        misses: metrics.performance_metrics.cache_stats.semantic_misses || metrics.performance_metrics.cache_stats.misses || 0,
        ttl_seconds: 3600 // Default TTL
    }] : [])

    // Generate colors for each operation
    const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(34, 197, 94, 0.8)',    // Green
        'rgba(251, 191, 36, 0.8)',   // Yellow
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(168, 85, 247, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(14, 165, 233, 0.8)',   // Sky
        'rgba(99, 102, 241, 0.8)',   // Indigo
    ]

    const borderColors = [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(236, 72, 153)',
        'rgb(14, 165, 233)',
        'rgb(99, 102, 241)',
    ]

    const chartData = {
        labels: operationMetrics.map(op => 
            op.operation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ),
        datasets: [
            {
                label: 'Cache Hits',
                data: operationMetrics.map(op => op.hits),
                backgroundColor: colors.slice(0, operationMetrics.length),
                borderColor: borderColors.slice(0, operationMetrics.length),
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#374151',
                    font: {
                        size: 12
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const operation = operationMetrics[context.dataIndex]
                        const total = operation.hits + operation.misses
                        const percentage = total > 0 ? ((operation.hits / total) * 100).toFixed(1) : '0.0'
                        
                        return [
                            `${context.label}: ${context.parsed} hits`,
                            `Hit Rate: ${percentage}%`,
                            `Total Requests: ${total}`
                        ]
                    }
                }
            }
        },
        elements: {
            arc: {
                borderWidth: 2
            }
        }
    }

    return (
        <div className="h-64 w-full">
            <Pie data={chartData} options={options} />
        </div>
    )
}
