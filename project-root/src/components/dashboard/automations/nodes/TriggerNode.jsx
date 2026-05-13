import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

const TriggerNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-yellow-400">
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-yellow-100 mr-2">
          <Zap size={16} className="text-yellow-600" />
        </div>
        <div className="ml-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trigger</div>
          <div className="text-sm font-semibold">{data.label || 'Event Occurred'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-400 border-2 border-white"
      />
    </div>
  );
};

export default TriggerNode;
