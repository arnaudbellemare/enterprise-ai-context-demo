/**
 * Approval Gate Node Component - HITL Workflow Integration
 * 
 * Displays approval gates in workflows where human approval is required
 * before proceeding with critical operations.
 */

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ApprovalGateData {
  id: string;
  label: string;
  criteria: {
    riskThreshold: number;
    confidenceThreshold: number;
    amountThreshold?: number;
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
    domain: 'finance' | 'legal' | 'medical' | 'security' | 'general';
  };
  approverRole: string;
  status: 'active' | 'approved' | 'rejected' | 'pending';
  timeout: number;
}

export function ApprovalGateNode({ data, isConnectable }: NodeProps<ApprovalGateData>) {
  const [status, setStatus] = useState(data.status || 'active');
  const [timeRemaining, setTimeRemaining] = useState(data.timeout);

  useEffect(() => {
    if (status === 'pending' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [status, timeRemaining]);

  const getStatusColor = () => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'timeout': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      case 'timeout': return '⏰';
      default: return '🛑';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[200px]`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />

      {/* Node Content */}
      <div className="flex flex-col items-center space-y-2">
        {/* Status Icon */}
        <div className={`w-8 h-8 rounded-full ${getStatusColor()} flex items-center justify-center text-white text-lg`}>
          {getStatusIcon()}
        </div>

        {/* Node Label */}
        <div className="text-center">
          <div className="font-bold text-sm">{data.label}</div>
          <div className="text-xs text-gray-600">Approval Gate</div>
        </div>

        {/* Criteria Display */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Risk: {data.criteria.riskThreshold}</div>
          <div>Confidence: {data.criteria.confidenceThreshold}</div>
          {data.criteria.amountThreshold && (
            <div>Amount: ${data.criteria.amountThreshold.toLocaleString()}</div>
          )}
          <div>Domain: {data.criteria.domain}</div>
        </div>

        {/* Approver Role */}
        <div className="text-xs text-blue-600 font-medium">
          Approver: {data.approverRole}
        </div>

        {/* Status and Timer */}
        <div className="text-center">
          <div className={`text-xs font-medium ${
            status === 'approved' ? 'text-green-600' :
            status === 'rejected' ? 'text-red-600' :
            status === 'pending' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            {status.toUpperCase()}
          </div>
          
          {status === 'pending' && timeRemaining > 0 && (
            <div className="text-xs text-orange-600">
              Timeout: {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Action Buttons (for demo) */}
        {status === 'active' && (
          <div className="flex space-x-1">
            <button
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => setStatus('approved')}
            >
              Approve
            </button>
            <button
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => setStatus('rejected')}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
    </div>
  );
}

export default ApprovalGateNode;
