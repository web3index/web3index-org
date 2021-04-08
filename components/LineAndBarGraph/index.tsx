import { useEffect, useRef, useState } from "react";
import { defaultTheme } from "../../stitches.config";
import Box from "../Box";

const LineAndBarGraph = ({ color, days }) => {
  const chartRef = useRef(null);
  const [chartCreated, setChartCreated] = useState(null);
  useEffect(() => {
    if (!chartCreated) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createChart } = require("lightweight-charts");
      const chart = createChart(chartRef.current, {
        width: 700,
        height: 400,
        layout: {
          backgroundColor: "transparent",
          textColor: "#fff",
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.2,
            bottom: 0,
          },
          borderVisible: false,
        },
        timeScale: {
          borderVisible: false,
        },
        grid: {
          horzLines: {
            color: "rgba(197, 203, 206, 0.5)",
            visible: false,
          },
          vertLines: {
            color: "rgba(197, 203, 206, 0.5)",
            visible: false,
          },
        },
        crosshair: {
          horzLine: {
            visible: false,
            labelVisible: false,
          },
          vertLine: {
            visible: true,
            style: 0,
            width: 2,
            color: "rgba(32, 38, 46, 0.1)",
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

      const volumeSeries = chart.addHistogramSeries({
        scaleMargins: {
          top: 0.32,
          bottom: 0,
        },
        lineColor: color,
        color: color,
        priceFormat: {
          type: "volume",
        },
      });

      // parse the data and format for tradingview consumption
      const formattedData = days.map((day) => {
        return {
          time: new Date(day.date * 1000).toLocaleDateString("fr-CA"),
          value: day.revenue,
        };
      });
      //lineSeries.setData(formattedData);
      volumeSeries.setData(formattedData);
      setChartCreated(chartCreated);
    }
  }, [chartCreated]);

  return <Box ref={chartRef} />;
};

export default LineAndBarGraph;
