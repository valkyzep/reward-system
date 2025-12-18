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
  return (
    <div className="points-range-container flex flex-col gap-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#1B2D3B' }}>
      <h4 className="points-range-title text-lg font-semibold text-white flex items-center gap-2">
        <img src="/pts.png" alt="Points" className="points-range-icon w-5 h-5 inline-block align-middle" />
        Points Range
      </h4>
      <div className="points-range-minmax flex justify-between text-xs text-gray-400 mb-1">
        <span>0</span>
        <span>500,000</span>
      </div>
      <Slider
        min={0}
        max={500000}
        value={value[1]}
        onChange={(val) => onChange([0, val as number])}
        trackStyle={{ background: 'linear-gradient(90deg, #eab308 0%, #facc15 100%)', height: 6 }}
        handleStyle={{ borderColor: '#ffffff', backgroundColor: '#ffffff', height: 16, width: 16, marginTop: -5, boxShadow: 'none' }}
        railStyle={{ background: '#374151', height: 6 }}
      />
      <div className="points-range-preset-buttons flex gap-2 mt-2">
        <button
          onClick={() => onChange([0, 250000])}
          className="flex-1 px-3 py-1 text-sm font-semibold hover:bg-yellow-500 text-white transition-all duration-200"
          style={{ borderRadius: '4px', backgroundColor: '#0E1B23' }}
        >
          250,000
        </button>
        <button
          onClick={() => onChange([0, 500000])}
          className="flex-1 px-3 py-1 text-sm font-semibold hover:bg-yellow-500 text-white transition-all duration-200"
          style={{ borderRadius: '4px', backgroundColor: '#0E1B23' }}
        >
          500,000
        </button>
      </div>
    </div>
  );
};

export default PointsRangeSlider;
