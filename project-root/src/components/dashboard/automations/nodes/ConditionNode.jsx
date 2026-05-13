import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data }) => {
  return (
    <div className="px-4 py-4 shadow-md rounded-lg bg-white border-2 border-purple-400 min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-400 border-2 border-white"
      />
      <div className="flex flex-col items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100 mb-2">
          <GitBranch size={16} className="text-purple-600" />
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Condition</div>
        <div className="text-sm font-semibold text-center">{data.label || 'Split?'}</div>
      </div>
      
      <div className="flex justify-between w-full mt-4">
        <div className="relative flex flex-col items-center">
          <span className="text-[10px] font-bold text-green-600 mb-1">YES</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 bg-green-400 border-2 border-white"
            style={{ left: '25%' }}
          />
        </div>
        <div className="relative flex flex-col items-center">
          <span className="text-[10px] font-bold text-red-600 mb-1">NO</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 bg-red-400 border-2 border-white"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
