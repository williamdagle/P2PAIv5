import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LabResult {
  id: string;
  result_date: string;
  result_value: number;
  unit: string;
  zone: 'optimal' | 'functional_deviation' | 'abnormal';
  conventional_range_low: number;
  conventional_range_high: number;
  functional_range_low: number;
  functional_range_high: number;
  note?: string;
  source?: string;
}

interface LabTrendChartEnhancedProps {
  results: LabResult[];
  marker_name: string;
  unit: string;
  showLegend?: boolean;
}

const LabTrendChartEnhanced: React.FC<LabTrendChartEnhancedProps> = ({
  results,
  marker_name,
  unit,
  showLegend = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<LabResult | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sort results by date
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.result_date).getTime() - new Date(b.result_date).getTime()
  );

  const getTrend = () => {
    if (sortedResults.length < 2) return 'stable';
    const latest = sortedResults[sortedResults.length - 1].result_value;
    const previous = sortedResults[sortedResults.length - 2].result_value;
    const change = ((latest - previous) / previous) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const trend = getTrend();

  useEffect(() => {
    if (!canvasRef.current || sortedResults.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get reference ranges from first result (assuming consistent)
    const firstResult = sortedResults[0];
    const convLow = firstResult.conventional_range_low;
    const convHigh = firstResult.conventional_range_high;
    const funcLow = firstResult.functional_range_low;
    const funcHigh = firstResult.functional_range_high;

    // Calculate min/max for y-axis with padding
    const values = sortedResults.map((r) => r.result_value);
    const minValue = Math.min(...values, convLow);
    const maxValue = Math.max(...values, convHigh);
    const valueRange = maxValue - minValue;
    const yMin = minValue - valueRange * 0.1;
    const yMax = maxValue + valueRange * 0.1;

    // Helper functions
    const getX = (index: number) => {
      return padding.left + (index / (sortedResults.length - 1)) * chartWidth;
    };

    const getY = (value: number) => {
      return padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
    };

    // Draw color-coded background zones
    const drawZone = (low: number, high: number, color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      const yTop = getY(high);
      const yBottom = getY(low);
      ctx.fillRect(padding.left, yTop, chartWidth, yBottom - yTop);
      ctx.globalAlpha = 1;
    };

    // Red zone (abnormal - below conv low)
    if (convLow > yMin) {
      drawZone(yMin, convLow, '#ef4444', 0.1);
    }

    // Red zone (abnormal - above conv high)
    if (convHigh < yMax) {
      drawZone(convHigh, yMax, '#ef4444', 0.1);
    }

    // Yellow zone (functional deviation - between functional and conventional)
    if (funcLow > convLow) {
      drawZone(convLow, funcLow, '#f59e0b', 0.1);
    }
    if (funcHigh < convHigh) {
      drawZone(funcHigh, convHigh, '#f59e0b', 0.1);
    }

    // Green zone (optimal - within functional range)
    drawZone(funcLow, funcHigh, '#10b981', 0.15);

    // Draw reference range lines
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Conventional range lines
    ctx.beginPath();
    ctx.moveTo(padding.left, getY(convLow));
    ctx.lineTo(padding.left + chartWidth, getY(convLow));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, getY(convHigh));
    ctx.lineTo(padding.left + chartWidth, getY(convHigh));
    ctx.stroke();

    // Functional range lines
    ctx.strokeStyle = '#059669';
    ctx.beginPath();
    ctx.moveTo(padding.left, getY(funcLow));
    ctx.lineTo(padding.left + chartWidth, getY(funcLow));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, getY(funcHigh));
    ctx.lineTo(padding.left + chartWidth, getY(funcHigh));
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Draw y-axis labels
    ctx.fillStyle = '#4b5563';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const value = yMin + (i / yTicks) * (yMax - yMin);
      const y = getY(value);
      ctx.fillText(value.toFixed(1), padding.left - 5, y + 4);
    }

    // Draw x-axis labels (dates)
    ctx.textAlign = 'center';
    sortedResults.forEach((result, index) => {
      const x = getX(index);
      const date = new Date(result.result_date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x, padding.top + chartHeight + 20);
    });

    // Draw trend line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    sortedResults.forEach((result, index) => {
      const x = getX(index);
      const y = getY(result.result_value);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    sortedResults.forEach((result, index) => {
      const x = getX(index);
      const y = getY(result.result_value);

      // Point color based on zone
      const pointColor =
        result.zone === 'optimal' ? '#10b981' :
        result.zone === 'functional_deviation' ? '#f59e0b' :
        '#ef4444';

      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw unit label
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(unit, padding.left - 50, padding.top - 5);
  }, [sortedResults, unit]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;

    // Find closest point
    let closestResult: LabResult | null = null;
    let closestDistance = Infinity;

    sortedResults.forEach((result, index) => {
      const pointX = padding.left + (index / (sortedResults.length - 1)) * chartWidth;
      const distance = Math.abs(x - pointX);

      if (distance < closestDistance && distance < 20) {
        closestDistance = distance;
        closestResult = result;
      }
    });

    setHoveredPoint(closestResult);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (sortedResults.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No lab results available for {marker_name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with trend indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{marker_name}</h3>
          <p className="text-sm text-gray-600">{sortedResults.length} result{sortedResults.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="w-5 h-5 text-blue-600" />}
          {trend === 'down' && <TrendingDown className="w-5 h-5 text-blue-600" />}
          {trend === 'stable' && <Minus className="w-5 h-5 text-gray-600" />}
          <span className="text-sm font-medium text-gray-700">
            Latest: {sortedResults[sortedResults.length - 1].result_value} {unit}
          </span>
          {sortedResults[sortedResults.length - 1].zone === 'optimal' && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          {sortedResults[sortedResults.length - 1].zone === 'abnormal' && (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-white rounded-lg border border-gray-200 p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-64 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: `${mousePos.x + 10}px`,
              top: `${mousePos.y + 10}px`,
            }}
          >
            <div className="text-sm space-y-1">
              <div className="font-semibold text-gray-900">
                {new Date(hoveredPoint.result_date).toLocaleDateString()}
              </div>
              <div className="text-gray-700">
                Value: {hoveredPoint.result_value} {hoveredPoint.unit}
              </div>
              <div className={`text-xs font-medium ${
                hoveredPoint.zone === 'optimal' ? 'text-green-600' :
                hoveredPoint.zone === 'functional_deviation' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {hoveredPoint.zone === 'optimal' ? 'Optimal' :
                 hoveredPoint.zone === 'functional_deviation' ? 'Functional Deviation' :
                 'Abnormal'}
              </div>
              {hoveredPoint.source && (
                <div className="text-xs text-gray-500">Source: {hoveredPoint.source}</div>
              )}
              {hoveredPoint.note && (
                <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                  {hoveredPoint.note}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Reference Ranges</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span className="text-gray-700">Optimal (Functional): {sortedResults[0].functional_range_low} - {sortedResults[0].functional_range_high}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span className="text-gray-700">Functional Deviation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span className="text-gray-700">Abnormal (Outside {sortedResults[0].conventional_range_low} - {sortedResults[0].conventional_range_high})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTrendChartEnhanced;
