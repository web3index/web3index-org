import { useEffect, useRef, useState } from "react";
import { defaultTheme } from "../../stitches.config";
import Box from "../Box";

const LineGraph = ({ color, days }) => {
  const chartRef = useRef(null);
  const [chartCreated, setChartCreated] = useState(null);

  useEffect(() => {
    if (!chartCreated) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createChart } = require("lightweight-charts");
      const chart = createChart(chartRef.current, { width: 56, height: 24 });
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
          time: day.date * 1000,
          value: day.revenue,
        };
      });
      lineSeries.setData(formattedData);
      setChartCreated(chart);
    }
  }, [chartCreated, days, color]);

  return <Box ref={chartRef} />;
};

export default LineGraph;
