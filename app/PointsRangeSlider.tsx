import React from 'react';

import Slider from 'rc-slider';
// @ts-ignore - CSS import
import 'rc-slider/assets/index.css';

interface PointsRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const PointsRangeSlider: React.FC<PointsRangeSliderProps> = ({ min, max, value, onChange }) => {
  // Format large numbers with commas or abbreviations
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
    }
    return num.toLocaleString();
  };

  // Calculate preset buttons based on max value
  const presetValues = [
    Math.floor(max * 0.25),
    Math.floor(max * 0.5),
    Math.floor(max * 0.75),
    max
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

  return (
    <div className="points-range-container flex flex-col gap-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#1B2D3B' }}>
      <h4 className="points-range-title text-lg font-semibold text-white flex items-center gap-2">
        Price Range
      </h4>
      <div className="points-range-minmax flex justify-between text-xs text-gray-400 mb-1">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
      <Slider
        min={min}
        max={max}
        value={value[1]}
        onChange={(val) => onChange([min, val as number])}
        trackStyle={{ background: 'linear-gradient(90deg, #eab308 0%, #facc15 100%)', height: 6 }}
        handleStyle={{ borderColor: '#ffffff', backgroundColor: '#ffffff', height: 16, width: 16, marginTop: -5, boxShadow: 'none' }}
        railStyle={{ background: '#374151', height: 6 }}
      />
    </div>
  );
};

export default PointsRangeSlider;
