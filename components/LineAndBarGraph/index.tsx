import { useEffect, useRef } from "react";
import { formatDataForWeekly, formattedNum } from "../../lib/utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Box from "../Box";
import { useTheme } from "next-themes";
import { defaultTheme } from "../../stitches.config";

dayjs.extend(utc);

const LineAndBarGraph = ({
  base,
  baseChange,
  unit = "usd",
  width,
  height,
  color: brandColor,
  title = "Demand-side Protocol Fees",
  days,
  useWeekly = false,
}) => {
  const { resolvedTheme } = useTheme();
  // reference for DOM element to create with chart
  const chartRef = useRef(null);
  const headerRef = useRef(null);
  // use ref so we can destroy the old chart before creating a new one
  const chartInstanceRef = useRef(null);
  const tooltipRef = useRef(null);
  const chartHeight = height ?? 420;

  const weeks = formatDataForWeekly(days);

  // parse the data and format for tradingview consumption
  const formattedData = weeks.map((week) => {
    const time = new Date(week.date * 1000).toLocaleDateString("fr-CA");
    if (week?.empty) return { time };

    return {
      time,
      value: week.revenue,
    };
  });

  const destroyChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }
    if (tooltipRef.current?.parentNode) {
      tooltipRef.current.parentNode.removeChild(tooltipRef.current);
    }
    tooltipRef.current = null;
  };

  const createTooltip = () => {
    if (!headerRef.current) {
      return null;
    }
    const toolTip = document.createElement("div");
    toolTip.setAttribute("id", "tooltip-id");
    toolTip.className = "three-line-legend";
    toolTip.style.display = "block";
    toolTip.style.fontWeight = "500";
    toolTip.style.backgroundColor = "transparent";
    headerRef.current.prepend(toolTip);
    tooltipRef.current = toolTip;
    return toolTip;
  };

  useEffect(() => {
    if (!formattedData?.length || !chartRef.current || !headerRef.current) {
      destroyChart();
      return;
    }
    if (typeof window === "undefined" || width === undefined) return;

    destroyChart();

    const { createChart } = require("lightweight-charts");
    const chart = createChart(chartRef.current, {
      width,
      height: chartHeight,
      layout: {
        textColor: "black",
        backgroundColor: "transparent",
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
          visible: true,
        },
        vertLines: {
          color: "rgba(197, 203, 206, 0.5)",
          visible: true,
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

    const percentChange = baseChange?.toFixed(2);
    const formattedPercentChange =
      (percentChange > 0 ? "+" : "") + percentChange + "%";
    const color =
      percentChange >= 0 ? defaultTheme.colors.green : defaultTheme.colors.red;

    const volumeSeries = chart.addHistogramSeries({
      scaleMargins: {
        top: 0.32,
        bottom: 0,
      },
      lineColor: brandColor,
      color: brandColor,
      priceFormat: {
        type: "volume",
      },
    });

    volumeSeries.setData(formattedData);

    const toolTip = createTooltip();

    const setLastBarText = ({ toolTip, formattedPercentChange, color }) => {
      if (!toolTip) return;
      toolTip.innerHTML =
        `<div class="tooltip-text" style="display: flex; align-items: center; font-size: 40px; font-weight: 700; margin: 0px;">` +
        formattedNum(base, unit) +
        `<span style="font-weight: 500; margin-left: 10px; font-size: 16px; color: ${color};">${formattedPercentChange}</span>` +
        "</div>";
    };

    setLastBarText({ toolTip, formattedPercentChange, color });

    // update the title when hovering on the chart
    const crosshairHandler = function (param) {
      if (
        !toolTip ||
        param === undefined ||
        param.time === undefined ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > chartHeight
      ) {
        setLastBarText({ toolTip, formattedPercentChange, color });
      } else {
        const dateStr = useWeekly
          ? dayjs(
              param.time.year + "-" + param.time.month + "-" + param.time.day,
            )
              .startOf("week")
              .format("MMMM D, YYYY") +
            "-" +
            dayjs(
              param.time.year + "-" + param.time.month + "-" + param.time.day,
            )
              .endOf("week")
              .format("MMMM D, YYYY")
          : dayjs(
              param.time.year + "-" + param.time.month + "-" + param.time.day,
            ).format("MMMM D, YYYY");

        const val = param.seriesPrices.get(volumeSeries);

        toolTip.innerHTML =
          `<div class="tooltip-text" style="font-size: 40px; font-weight: 700; margin: 0px;">` +
          formattedNum(val, unit) +
          "</div>" +
          "<div>" +
          dateStr +
          "</div>";
      }
    };

    // update the title when hovering on the chart
    chart.subscribeCrosshairMove(crosshairHandler);

    chart.timeScale().fitContent();
    chartInstanceRef.current = chart;

    return () => {
      if (chartInstanceRef.current && crosshairHandler) {
        chartInstanceRef.current.unsubscribeCrosshairMove(crosshairHandler);
      }
      destroyChart();
    };
  }, [
    resolvedTheme,
    days,
    base,
    baseChange,
    unit,
    useWeekly,
    width,
    formattedData,
    brandColor,
    chartHeight,
  ]);

  // responsiveness
  useEffect(() => {
    if (width) {
      chartInstanceRef.current?.resize(width, chartHeight);
      chartInstanceRef.current?.timeScale().scrollToPosition(0);
    }

    chartInstanceRef.current?.applyOptions({
      layout: {
        textColor: resolvedTheme === "dark" ? "white" : "black",
        backgroundColor: "transparent",
      },
    });
  }, [width, chartHeight, resolvedTheme]);

  return (
    <Box
      css={{
        ".three-line-legend": {
          width: "100%",
          height: 70,
          fontSize: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.23)",
          textAlign: "left",
          zIndex: "10",
          top: "8px",
          position: "relative",
          pointerEvents: "none",
          color: "$hiContrast",
        },
        position: "relative",
      }}>
      <Box
        css={{
          fontSize: "14px",
          mb: "8px",
          fontWeight: 500,
        }}>
        {title} (7d)
      </Box>
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "$4",
        }}
        ref={headerRef}
      />
      <Box ref={chartRef} />
      <Box
        css={{
          position: "absolute",
          right: "0",
          borderRadius: "3px",
          height: "16px",
          width: "16px",
          padding: "0px",
          bottom: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "primary",
          ":hover": {
            cursor: "pointer",
            opacity: "0.7",
          },
        }}>
        <Box
          onClick={() => {
            chartInstanceRef.current &&
              chartInstanceRef.current.timeScale().fitContent();
          }}
        />
      </Box>
    </Box>
  );
};

export default LineAndBarGraph;
