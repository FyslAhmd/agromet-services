import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const ValidationChart = ({ title, unit, dates, forecastData, observedData, parameter }) => {
  const isRainfall = parameter.toLowerCase().includes('rainfall');

  const options = {
    chart: {
      type: isRainfall ? 'column' : 'spline',
      height: 350,
      style: {
        fontFamily: 'inherit',
      },
      backgroundColor: 'transparent',
    },
    title: {
      text: null,
    },
    xAxis: {
      categories: dates,
      crosshair: true,
      labels: {
        style: {
          color: '#6b7280',
          fontSize: '11px',
        },
      },
    },
    yAxis: {
      title: {
        text: unit ? `${title} (${unit})` : title,
        style: {
          color: '#6b7280',
          fontSize: '12px',
          fontWeight: 'normal',
        },
      },
      labels: {
        style: {
          color: '#6b7280',
        },
      },
    },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadow: true,
      style: {
        color: '#1f2937',
      },
    },
    plotOptions: {
      spline: {
        lineWidth: 2.5,
        marker: {
          radius: 4,
          symbol: 'circle',
        },
      },
      column: {
        borderRadius: 4,
        pointPadding: 0.1,
        borderWidth: 0,
      },
    },
    legend: {
      layout: 'horizontal',
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: '12px',
      },
    },
    series: [
      {
        name: 'Forecast',
        data: forecastData,
        color: '#0ea5e9',
      },
      {
        name: 'Observed',
        data: observedData,
        color: '#f59e0b',
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default ValidationChart;
