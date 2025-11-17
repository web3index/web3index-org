import { useEffect, useRef } from "react";
import Box from "../Box";

type Dimensions = {
  width: number;
  height: number;
};

type Day = {
  date: number;
  revenue: number;
};

type props = {
  color: string;
  days: Day[];
  dimensions?: Dimensions;
};

const LineGraph = ({ color, days, dimensions }: props) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createChart } = require("lightweight-charts");
    const chart = createChart(chartRef.current, {
      width: dimensions ? dimensions.width : 70,
      height: dimensions ? dimensions.height : 30,
    });
    chart.applyOptions({
      scales: {
        xAxis: {
          visible: false,
        },
      },
      priceScale: {
        position: "none",
        drawTicks: false,
        borderVisible: false,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      layout: {
        backgroundColor: "transparent",
        textColor: "transparent",
      },
      handleScroll: false,
      handleScale: false,
      timeScale: {
        visible: false,
      },
      crosshair: {
        vertLine: {
          visible: false,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    });

    chart.timeScale().fitContent();
    const lineSeries = chart.addLineSeries({
      priceLineVisible: false,
      lastValueVisible: false,
      lineStyle: 0,
      lineWidth: 2,
      color,
      crosshairMarkerVisible: false,
    });

    // parse the data and format for tradingview consumption
    const formattedData = days.map((day) => {
      return {
        time: new Date(day.date * 1000).toLocaleDateString("fr-CA"),
        value: days.length < 60 ? 0 : day.revenue,
      };
    });
    lineSeries.setData(formattedData);
    chartInstanceRef.current = chart;

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [days, color, dimensions]);

  return <Box ref={chartRef} />;
};

export default LineGraph;
