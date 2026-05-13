import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

const WaitNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-orange-400">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-400 border-2 border-white"
      />
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100 mr-2">
          <Clock size={16} className="text-orange-600" />
        </div>
        <div className="ml-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delay</div>
          <div className="text-sm font-semibold">{data.label || 'Wait'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-400 border-2 border-white"
      />
    </div>
  );
};

export default WaitNode;
