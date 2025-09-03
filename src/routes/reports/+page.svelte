<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  
  export let data;
  
  let scadTrendsChart: HTMLDivElement;
  let downloadDistributionChart: HTMLDivElement;
  let activeUsersChart: HTMLDivElement;
  let dailyUploadsChart: HTMLDivElement;
  let fileSizeChart: HTMLDivElement;
  
  onMount(() => {
    initializeCharts();
  });
  
  function initializeCharts() {
    // SCAD Upload Trends (Line Chart)
    if (scadTrendsChart) {
      const chart = echarts.init(scadTrendsChart);
      const option = {
        title: {
          text: 'SCAD Upload Trends',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: data.charts.scadTrends.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'Files Uploaded'
        },
        series: [{
          data: data.charts.scadTrends.map(item => item.count),
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#28a745'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(40, 167, 69, 0.3)'
              }, {
                offset: 1, color: 'rgba(40, 167, 69, 0.1)'
              }]
            }
          }
        }]
      };
      chart.setOption(option);
      
      // Responsive
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Download Distribution (Pie Chart)
    if (downloadDistributionChart) {
      const chart = echarts.init(downloadDistributionChart);
      const option = {
        title: {
          text: 'Download Distribution',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} files ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          name: 'Downloads',
          type: 'pie',
          radius: '50%',
          data: data.charts.downloadDistribution.map(item => ({
            value: item.count,
            name: item.downloadRange + ' downloads'
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8'];
              return colors[params.dataIndex % colors.length];
            }
          }
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Active Users (Bar Chart)
    if (activeUsersChart) {
      const chart = echarts.init(activeUsersChart);
      const option = {
        title: {
          text: 'Most Active Contributors',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params: any) {
            const userData = data.charts.activeUsers[params[0].dataIndex];
            return `${userData.username}<br/>Files: ${userData.scadCount}<br/>Total Downloads: ${userData.totalDownloads}`;
          }
        },
        xAxis: {
          type: 'value',
          name: 'Number of Files'
        },
        yAxis: {
          type: 'category',
          data: data.charts.activeUsers.map(item => item.username).reverse(),
          axisLabel: {
            width: 100,
            overflow: 'truncate'
          }
        },
        series: [{
          data: data.charts.activeUsers.map(item => item.scadCount).reverse(),
          type: 'bar',
          itemStyle: {
            color: '#6f42c1'
          },
          barMaxWidth: 30
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Daily Uploads with Downloads (Dual Axis Chart)
    if (dailyUploadsChart) {
      const chart = echarts.init(dailyUploadsChart);
      const option = {
        title: {
          text: 'Daily Upload Activity',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['Uploads', 'Total Downloads'],
          bottom: 0
        },
        xAxis: {
          type: 'category',
          data: data.charts.dailyUploads.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [{
          type: 'value',
          name: 'Number of Uploads',
          position: 'left'
        }, {
          type: 'value',
          name: 'Total Downloads',
          position: 'right'
        }],
        series: [{
          name: 'Uploads',
          type: 'bar',
          data: data.charts.dailyUploads.map(item => item.count),
          itemStyle: {
            color: '#007bff'
          }
        }, {
          name: 'Total Downloads',
          type: 'line',
          yAxisIndex: 1,
          data: data.charts.dailyUploads.map(item => item.totalDownloads),
          smooth: true,
          itemStyle: {
            color: '#e83e8c'
          }
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }

    // File Size Distribution (Doughnut Chart)
    if (fileSizeChart) {
      const chart = echarts.init(fileSizeChart);
      const option = {
        title: {
          text: 'File Size Distribution',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} files ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          name: 'File Size',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          data: data.charts.fileSizeDistribution.map(item => ({
            value: item.count,
            name: item.sizeRange
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              const colors = ['#17a2b8', '#20c997', '#28a745', '#ffc107', '#fd7e14'];
              return colors[params.dataIndex % colors.length];
            }
          }
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
  }
</script>

<div class="container">
  <div class="reports-header">
    <h1>OpenSCAD Analytics Dashboard</h1>
    <p class="subtitle">Insights and statistics from your 3D model sharing platform</p>
    {#if data.stats.totalScads === 0}
      <div class="no-files-notice">
        <p>📁 No SCAD files uploaded yet.</p>
        <p>Start sharing your OpenSCAD creations to see detailed analytics!</p>
        <a href="/" class="upload-btn">Browse Files</a>
      </div>
    {/if}
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{data.stats.totalScads}</div>
      <div class="stat-label">Total SCAD Files</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{data.stats.totalUsers}</div>
      <div class="stat-label">Contributors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{data.stats.totalDownloads}</div>
      <div class="stat-label">Total Downloads</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{data.stats.scadsWithModels}</div>
      <div class="stat-label">With 3D Models</div>
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="charts-grid">
    <div class="chart-container">
      <div class="chart" bind:this={scadTrendsChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={downloadDistributionChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={activeUsersChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={dailyUploadsChart}></div>
    </div>

    <div class="chart-container">
      <div class="chart" bind:this={fileSizeChart}></div>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .reports-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .reports-header h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #28a745;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #666;
    font-size: 1rem;
    font-weight: 500;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 2rem;
  }

  .chart-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .chart {
    width: 100%;
    height: 400px;
  }

  @media (max-width: 1024px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      min-width: 0;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }

    .reports-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .stat-value {
      font-size: 2rem;
    }

    .chart {
      height: 300px;
    }
  }

  .no-files-notice {
    background: #e8f5e8;
    border: 1px solid #28a745;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    text-align: center;
  }

  .no-files-notice p {
    margin: 0.5rem 0;
    color: #1e7e34;
  }

  .upload-btn {
    display: inline-block;
    background: #28a745;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    margin-top: 1rem;
    transition: background 0.2s;
  }

  .upload-btn:hover {
    background: #1e7e34;
  }
</style>