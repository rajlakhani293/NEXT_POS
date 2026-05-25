import { createListenerMiddleware } from '@reduxjs/toolkit';

export const rtkQueryLogger = createListenerMiddleware();

rtkQueryLogger.startListening({
  predicate: (action) => {
    // Log all RTK Query actions
    return action.type.endsWith('/pending') || 
           action.type.endsWith('/fulfilled') || 
           action.type.endsWith('/rejected');
  },
  effect: (action) => {
    const { type } = action;
    const timestamp = new Date().toISOString();
    
    // Type-safe access to meta and payload
    const meta = (action as any).meta;
    const payload = (action as any).payload;
    
    console.log(`[${timestamp}] RTK Query: ${type}`, {
      endpoint: meta?.arg?.endpointName,
      status: type.split('/').pop(),
      payload,
    });
  },
});
