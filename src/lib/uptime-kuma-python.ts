/**
 * Python Script Execution Helper for Uptime Kuma API
 * 
 * Executes Python scripts using Node.js child_process to interact with
 * Uptime Kuma via the uptime-kuma-api wrapper.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';

const SCRIPT_TIMEOUT = 30000; // 30 seconds
const PYTHON_SCRIPT_DIR = join(process.cwd(), 'scripts', 'uptime-kuma');

export interface PythonScriptResult {
  success: boolean;
  monitorID?: number;
  message?: string;
  error?: string;
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
 */
async function getPythonCommand(): Promise<string> {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', ['--version'], { shell: true });
    
    pythonProcess.on('close', (code) => {
      resolve(code === 0 ? 'python' : 'python3');
    });
    
    pythonProcess.on('error', () => {
      resolve('python3');
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

    // Spawn Python process
    const pythonProcess = spawn(pythonCmd, [scriptPath], {
      shell: true,
      env: {
        ...process.env, // Pass all environment variables to Python script
      },
    });

    // Set timeout
    const timeout = setTimeout(() => {
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

    // Collect stderr
    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        // Try to parse error output as JSON to get structured error
        let errorMessage = stderr || stdout;
        try {
          const errorJson = JSON.parse(stdout.trim() || stderr.trim());
          if (errorJson.error) {
            errorMessage = errorJson.error;
            if (errorJson.traceback) {
              console.error('Python traceback:', errorJson.traceback);
            }
          }
        } catch {
          // Not JSON, use raw output
        }
        reject(new Error(`Python script exited with code ${code}. ${errorMessage}`));
        return;
      }

      // Parse JSON output
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
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

