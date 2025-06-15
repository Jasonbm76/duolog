// Environment detection for DuoLog.ai
// Used to prevent destructive operations in production

export const isProduction = 
  process.env.VERCEL_ENV === 'production' || 
  process.env.NODE_ENV === 'production';

export const isPreview = 
  process.env.VERCEL_ENV === 'preview';

export const isDevelopment = 
  process.env.NODE_ENV === 'development' && 
  !process.env.VERCEL_ENV;

export const isLocal = 
  !process.env.VERCEL_ENV && 
  process.env.NODE_ENV === 'development';

// Safety check for destructive operations
export function preventDestructiveOps(operation: string) {
  if (isProduction) {
    throw new Error(`❌ FORBIDDEN: ${operation} blocked in production environment`);
  }
  
  if (isPreview) {
    console.warn(`⚠️ WARNING: ${operation} in preview environment`);
  }
}

// Log environment context safely
export function logEnvironmentContext() {
  console.log('Environment:', {
    isProduction,
    isPreview, 
    isDevelopment,
    isLocal,
    vercelEnv: process.env.VERCEL_ENV || 'none',
    nodeEnv: process.env.NODE_ENV || 'none'
  });
}