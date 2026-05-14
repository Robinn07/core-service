import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, Tag, UserMinus, UserPlus, Edit3, Copy, Move, UserX, Globe } from 'lucide-react';

const ActionNode = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'send_email': return <Mail size={16} className="text-blue-600" />;
      case 'add_tag': return <Tag size={16} className="text-green-600" />;
      case 'remove_tag': return <UserMinus size={16} className="text-red-600" />;
      case 'update_property': return <Edit3 size={16} className="text-purple-600" />;
      case 'copy_to_list': return <Copy size={16} className="text-cyan-600" />;
      case 'move_to_list': return <Move size={16} className="text-orange-600" />;
      case 'unsubscribe': return <UserX size={16} className="text-pink-600" />;
      case 'send_webhook': return <Globe size={16} className="text-indigo-600" />;
      default: return <UserPlus size={16} className="text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (data.type) {
      case 'send_email': return 'bg-blue-100';
      case 'add_tag': return 'bg-green-100';
      case 'remove_tag': return 'bg-red-100';
      case 'update_property': return 'bg-purple-100';
      case 'copy_to_list': return 'bg-cyan-100';
      case 'move_to_list': return 'bg-orange-100';
      case 'unsubscribe': return 'bg-pink-100';
      case 'send_webhook': return 'bg-indigo-100';
      default: return 'bg-gray-100';
    }
  };

  const getBorderColor = () => {
    switch (data.type) {
      case 'send_email': return 'border-blue-400';
      case 'add_tag': return 'border-green-400';
      case 'remove_tag': return 'border-red-400';
      case 'update_property': return 'border-purple-400';
      case 'copy_to_list': return 'border-cyan-400';
      case 'move_to_list': return 'border-orange-400';
      case 'unsubscribe': return 'border-pink-400';
      case 'send_webhook': return 'border-indigo-400';
      default: return 'border-blue-400';
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${getBorderColor()}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${getBorderColor().replace('border-', 'bg-')} border-2 border-white`}
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
