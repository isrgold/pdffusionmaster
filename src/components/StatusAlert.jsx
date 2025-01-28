import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StatusAlert = ({ status }) => (
  status.message && (
    <Alert className={`mb-4 ${
      status.type === 'error' ? 'bg-red-50' :
      status.type === 'success' ? 'bg-green-50' :
      'bg-blue-50'
    }`}>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  )
);

export default StatusAlert;
