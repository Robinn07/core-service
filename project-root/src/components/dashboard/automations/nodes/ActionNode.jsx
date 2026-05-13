import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, Tag, UserMinus, UserPlus } from 'lucide-react';

const ActionNode = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'send_email': return <Mail size={16} className="text-blue-600" />;
      case 'add_tag': return <Tag size={16} className="text-green-600" />;
      case 'remove_tag': return <UserMinus size={16} className="text-red-600" />;
      default: return <UserPlus size={16} className="text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (data.type) {
      case 'send_email': return 'bg-blue-100';
      case 'add_tag': return 'bg-green-100';
      case 'remove_tag': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-400">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
      <div className="flex items-center">
        <div className={`rounded-full w-8 h-8 flex items-center justify-center ${getBgColor()} mr-2`}>
          {getIcon()}
        </div>
        <div className="ml-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action</div>
          <div className="text-sm font-semibold">{data.label || 'Action'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
    </div>
  );
};

export default ActionNode;
