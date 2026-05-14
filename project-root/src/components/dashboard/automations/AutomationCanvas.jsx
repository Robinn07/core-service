import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import WaitNode from './nodes/WaitNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  wait: WaitNode,
};

const AutomationCanvas = ({ automationId, initialData }) => {
  const [nodes, setNodes] = useState(initialData?.canvasState?.nodes || []);
  const [edges, setEdges] = useState(initialData?.canvasState?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  };

  const saveCanvas = async () => {
    // ... existing save logic ...
  };

  return (
    <div className="flex h-[700px] w-full border rounded-lg overflow-hidden bg-gray-50 relative">
      <div className="flex-grow relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={saveCanvas}
            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 font-medium"
          >
            Save Workflow
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#aaa" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Configuration Sidebar */}
      {selectedNode && (
        <div className="w-80 border-l bg-white p-6 shadow-xl z-20 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Configure {selectedNode.type}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">LABEL</label>
              <input 
                type="text" 
                className="w-full border rounded p-2 text-sm"
                value={selectedNode.data.label || ''} 
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              />
            </div>

            {selectedNode.type === 'trigger' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TRIGGER EVENT</label>
                <select 
                   className="w-full border rounded p-2 text-sm"
                   value={selectedNode.data.triggerType}
                   onChange={(e) => updateNodeData(selectedNode.id, { triggerType: e.target.value })}
                >
                  <option value="subscriber_created">Subscriber Created</option>
                  <option value="list_joined">List Joined</option>
                  <option value="tag_added">Tag Added</option>
                  <option value="event_occurred">Custom Event</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
            )}

            {selectedNode.data.type === 'send_email' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SELECT TEMPLATE</label>
                <select 
                  className="w-full border rounded p-2 text-sm"
                  value={selectedNode.data.config?.templateId || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, templateId: e.target.value } })}
                >
                  <option value="">Select a template...</option>
                  {/* Dynamic templates would go here */}
                </select>
              </div>
            )}

            {selectedNode.type === 'wait' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">AMOUNT</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-2 text-sm"
                    value={selectedNode.data.config?.waitAmount || 1}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, waitAmount: parseInt(e.target.value) } })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">UNIT</label>
                  <select 
                    className="w-full border rounded p-2 text-sm"
                    value={selectedNode.data.config?.waitUnit || 'days'}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...selectedNode.data.config, waitUnit: e.target.value } })}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              className="w-full mt-8 bg-gray-800 text-white py-2 rounded font-semibold text-sm hover:bg-black transition-colors"
              onClick={() => setSelectedNode(null)}
            >
              Done
            </button>
            
            <button 
              className="w-full mt-2 text-red-500 py-2 text-xs font-bold hover:bg-red-50 rounded"
              onClick={() => {
                setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                setSelectedNode(null);
              }}
            >
              REMOVE STEP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationCanvas;
