/**
 * Python Script Execution Helper for Uptime Kuma API
 * 
 * Executes Python scripts using Node.js child_process to interact with
 * Uptime Kuma via the uptime-kuma-api wrapper.
 */

import { spawn } from 'child_process';
import { join } from 'path';

// Explicitly load environment variables from .env.local if not already loaded
// Next.js should load them automatically, but this ensures they're available
if (typeof process !== 'undefined' && !process.env.UPTIME_KUMA_API_URL) {
  try {
    // Try to load .env.local explicitly (only if not already loaded)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const envKey = key.trim();
            const envValue = valueParts.join('=').trim();
            // Remove quotes if present
            const cleanValue = envValue.replace(/^["']|["']$/g, '');
            if (!process.env[envKey]) {
              process.env[envKey] = cleanValue;
            }
          }
        }
      });
      console.log('[uptime-kuma-python] Loaded environment variables from .env.local');
    }
  } catch (error) {
    // Ignore errors - environment variables might already be loaded
    console.warn('[uptime-kuma-python] Could not load .env.local:', error);
  }
}
import { promisify } from 'util';

const SCRIPT_TIMEOUT = 60000; // 60 seconds - Python scripts can be slow when connecting to Uptime Kuma
const PYTHON_SCRIPT_DIR = join(process.cwd(), 'scripts', 'uptime-kuma');

export interface PythonScriptResult {
  success: boolean;
  monitorID?: number;
  message?: string;
  error?: string;
  beats?: any[]; // For get_monitor_beats script
  [key: string]: any; // Allow additional properties for different script results
}

/**
 * Validates that Python is available in the system
 */
export async function validatePythonEnvironment(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', ['--version'], { shell: true });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        // Try python3
        const python3Process = spawn('python3', ['--version'], { shell: true });
        python3Process.on('close', (code3) => {
          resolve(code3 === 0);
        });
        python3Process.on('error', () => {
          resolve(false);
        });
      }
    });
    
    pythonProcess.on('error', () => {
      // Try python3
      const python3Process = spawn('python3', ['--version'], { shell: true });
      python3Process.on('close', (code3) => {
        resolve(code3 === 0);
      });
      python3Process.on('error', () => {
        resolve(false);
      });
    });
  });
}

/**
 * Gets the Python command to use (python or python3)
 * On Render, Python is typically available as python3
 */
async function getPythonCommand(): Promise<string> {
  return new Promise((resolve) => {
    // Try python3 first (common on Linux/Render)
    const python3Process = spawn('python3', ['--version'], { shell: true });
    
    python3Process.on('close', (code) => {
      if (code === 0) {
        resolve('python3');
      } else {
        // Fallback to python
        const pythonProcess = spawn('python', ['--version'], { shell: true });
        pythonProcess.on('close', (code2) => {
          resolve(code2 === 0 ? 'python' : 'python3'); // Default to python3 if both fail
        });
        pythonProcess.on('error', () => {
          resolve('python3');
        });
      }
    });
    
    python3Process.on('error', () => {
      // Try python as fallback
      const pythonProcess = spawn('python', ['--version'], { shell: true });
      pythonProcess.on('close', (code) => {
        resolve(code === 0 ? 'python' : 'python3');
      });
      pythonProcess.on('error', () => {
        resolve('python3');
      });
    });
  });
}

/**
 * Executes a Python script with JSON input/output
 * 
 * @param scriptName Name of the Python script (without .py extension)
 * @param data JSON data to pass to the script via stdin
 * @returns Promise resolving to the script's JSON output
 */
export async function executePythonScript(
  scriptName: string,
  data: any
): Promise<PythonScriptResult> {
  // Validate Python environment
  const hasPython = await validatePythonEnvironment();
  if (!hasPython) {
    throw new Error('Python is not installed or not available in PATH. Please install Python 3.7+ and ensure it is accessible.');
  }

  const pythonCmd = await getPythonCommand();
  const scriptPath = join(PYTHON_SCRIPT_DIR, `${scriptName}.py`);

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    console.log(`[executePythonScript] Starting ${scriptName} with data:`, JSON.stringify(data));
    const startTime = Date.now();

    // Spawn Python process
    console.log(`[executePythonScript] Spawning Python process: ${pythonCmd} ${scriptPath}`);
    
    // Ensure Uptime Kuma environment variables are explicitly passed
    const env = {
      ...process.env,
      // Explicitly pass Uptime Kuma credentials to ensure they're available
      UPTIME_KUMA_API_URL: process.env.UPTIME_KUMA_API_URL || 'http://localhost:3003',
      UPTIME_KUMA_USERNAME: process.env.UPTIME_KUMA_USERNAME || 'admin',
      UPTIME_KUMA_PASSWORD: process.env.UPTIME_KUMA_PASSWORD || 'admin123',
      UPTIME_KUMA_API_KEY: process.env.UPTIME_KUMA_API_KEY || '',
    };
    
    // Log environment variables (mask password for security)
    const passwordLength = env.UPTIME_KUMA_PASSWORD ? env.UPTIME_KUMA_PASSWORD.length : 0;
    console.log(`[executePythonScript] Environment variables:`, {
      UPTIME_KUMA_API_URL: env.UPTIME_KUMA_API_URL,
      UPTIME_KUMA_USERNAME: env.UPTIME_KUMA_USERNAME,
      UPTIME_KUMA_PASSWORD: env.UPTIME_KUMA_PASSWORD ? `*** (${passwordLength} chars)` : '(not set)',
      UPTIME_KUMA_API_KEY: env.UPTIME_KUMA_API_KEY ? `*** (${env.UPTIME_KUMA_API_KEY.length} chars)` : '(not set)',
    });
    console.log(`[executePythonScript] Raw process.env check:`, {
      has_UPTIME_KUMA_API_URL: !!process.env.UPTIME_KUMA_API_URL,
      has_UPTIME_KUMA_USERNAME: !!process.env.UPTIME_KUMA_USERNAME,
      has_UPTIME_KUMA_PASSWORD: !!process.env.UPTIME_KUMA_PASSWORD,
      has_UPTIME_KUMA_API_KEY: !!process.env.UPTIME_KUMA_API_KEY,
    });
    
    const pythonProcess = spawn(pythonCmd, [scriptPath], {
      shell: true,
      env,
    });
    
    // Log when process starts
    pythonProcess.on('spawn', () => {
      console.log(`[executePythonScript] Python process spawned for ${scriptName} (PID: ${pythonProcess.pid})`);
    });

    // Set timeout
    const timeout = setTimeout(() => {
      const duration = Date.now() - startTime;
      console.error(`[executePythonScript] Timeout after ${duration}ms for ${scriptName}`);
      pythonProcess.kill();
      reject(new Error(`Python script execution timeout after ${SCRIPT_TIMEOUT}ms`));
    }, SCRIPT_TIMEOUT);

    // Send JSON data to stdin
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    // Collect stdout
    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    // Collect stderr (includes debug output from Python scripts)
    pythonProcess.stderr.on('data', (data: Buffer) => {
      const stderrText = data.toString();
      stderr += stderrText;
      // Log Python debug output to console
      console.log(`[executePythonScript] Python stderr: ${stderrText.trim()}`);
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      if (code !== 0) {
        // Try to parse error output as JSON to get structured error
        let errorMessage = stderr || stdout;
        try {
          const errorJson = JSON.parse(stdout.trim() || stderr.trim());
          if (errorJson.error) {
            errorMessage = errorJson.error;
            if (errorJson.traceback) {
              console.error(`[executePythonScript] Python traceback for ${scriptName}:`, errorJson.traceback);
            }
          }
        } catch {
          // Not JSON, use raw output
        }
        console.error(`[executePythonScript] ${scriptName} exited with code ${code} after ${duration}ms. Error: ${errorMessage}`);
        reject(new Error(`Python script exited with code ${code}. ${errorMessage}`));
        return;
      }

      // Parse JSON output
      try {
        const result = JSON.parse(stdout.trim());
        console.log(`[executePythonScript] ${scriptName} completed successfully in ${duration}ms`);
        resolve(result);
      } catch (parseError) {
        console.error(`[executePythonScript] Failed to parse output for ${scriptName} after ${duration}ms. stdout: ${stdout.substring(0, 500)}, stderr: ${stderr.substring(0, 500)}`);
        reject(new Error(`Failed to parse Python script output as JSON: ${stdout}. Error: ${stderr}`));
      }
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to execute Python script: ${error.message}`));
    });
  });
}

