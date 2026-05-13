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

  const saveCanvas = async () => {
    // 1. Prepare actions for backend
    const actions = nodes
      .filter((node) => node.type !== 'trigger')
      .map((node) => {
        const outgoingEdges = edges.filter((e) => e.source === node.id);
        
        let nextActionId = null;
        let falseActionId = null;

        if (node.type === 'condition') {
          nextActionId = outgoingEdges.find((e) => e.sourceHandle === 'true')?.target || null;
          falseActionId = outgoingEdges.find((e) => e.sourceHandle === 'false')?.target || null;
        } else {
          nextActionId = outgoingEdges[0]?.target || null;
        }

        let type = node.data.type || node.type;
        if (type === 'condition') type = 'split';

        return {
          id: node.id,
          type: type,
          config: node.data.config || {},
          nextActionId,
          falseActionId,
          order: 1 // We'll rely on graph links now, but keep order for legacy compatibility if needed
        };
      });

    // 2. Identify root action (connected to trigger)
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (triggerNode) {
        const firstEdge = edges.find(e => e.source === triggerNode.id);
        if (firstEdge) {
            const rootAction = actions.find(a => a.id === firstEdge.target);
            if (rootAction) rootAction.order = 1; // Mark as first
        }
    }

    const payload = {
      canvasState: { nodes, edges },
      actions
    };

    try {
      const response = await fetch(`/api/automations/${automationId}/canvas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert('Canvas saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save canvas:', error);
    }
  };

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden bg-gray-50 relative">
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
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default AutomationCanvas;
