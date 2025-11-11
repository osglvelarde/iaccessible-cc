import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface DebugInfo {
  timestamp: string;
  paths: Record<string, string>;
  python: Record<string, unknown>;
  filesystem: Record<string, unknown>;
  error?: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const info: DebugInfo = {
    timestamp: new Date().toISOString(),
    paths: {},
    python: {},
    filesystem: {},
  };

  try {
    // Get current working directory
    info.paths.cwd = process.cwd();
    info.paths.__dirname = __dirname;
    info.paths.projectRoot = path.resolve(process.cwd());
    info.paths.pythonPackagesPath = path.join(process.cwd(), '.python-packages');
    info.paths.scriptsPath = path.join(process.cwd(), 'scripts', 'uptime-kuma');

    // Check if .python-packages exists
    try {
      const stats = await fs.stat(info.paths.pythonPackagesPath);
      info.filesystem['.python-packages'] = {
        exists: true,
        isDirectory: stats.isDirectory(),
        size: stats.size,
      };

      // List contents
      try {
        const contents = await fs.readdir(info.paths.pythonPackagesPath);
        const pythonPackagesInfo = info.filesystem['.python-packages'] as Record<string, unknown>;
        pythonPackagesInfo.contents = contents.slice(0, 20); // First 20 items
        pythonPackagesInfo.count = contents.length;
        
        // Check for uptime_kuma_api specifically
        const uptimeKumaPath = path.join(info.paths.pythonPackagesPath, 'uptime_kuma_api');
        try {
          const uptimeStats = await fs.stat(uptimeKumaPath);
          pythonPackagesInfo.hasUptimeKumaApi = true;
          pythonPackagesInfo.uptimeKumaApiIsDir = uptimeStats.isDirectory();
        } catch {
          pythonPackagesInfo.hasUptimeKumaApi = false;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        (info.filesystem['.python-packages'] as Record<string, unknown>).readError = errorMessage;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      info.filesystem['.python-packages'] = {
        exists: false,
        error: errorMessage,
      };
    }

    // Check if scripts directory exists
    try {
      const scriptsStats = await fs.stat(info.paths.scriptsPath);
      info.filesystem.scripts = {
        exists: true,
        isDirectory: scriptsStats.isDirectory(),
      };
      const scriptFiles = await fs.readdir(info.paths.scriptsPath);
      (info.filesystem.scripts as Record<string, unknown>).files = scriptFiles;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      info.filesystem.scripts = {
        exists: false,
        error: errorMessage,
      };
    }

    // Check Python availability and version
    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn('python3', ['--version'], { shell: true });
      let pythonVersion = '';
      let pythonError = '';

      pythonProcess.stdout.on('data', (data) => {
        pythonVersion += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });

      pythonProcess.on('close', (code) => {
        info.python.version = pythonVersion.trim() || pythonError.trim();
        info.python.available = code === 0;
        info.python.exitCode = code;

        // Try to check if uptime_kuma_api can be imported
        const checkImportProcess = spawn(
          'python3',
          [
            '-c',
            `import sys; sys.path.insert(0, '${info.paths.pythonPackagesPath}'); import uptime_kuma_api; print('SUCCESS')`,
          ],
          { shell: true }
        );

        let importResult = '';
        let importError = '';

        checkImportProcess.stdout.on('data', (data) => {
          importResult += data.toString();
        });

        checkImportProcess.stderr.on('data', (data) => {
          importError += data.toString();
        });

        checkImportProcess.on('close', (importCode) => {
          info.python.uptimeKumaApi = {
            canImport: importCode === 0,
            output: importResult.trim(),
            error: importError.trim(),
            exitCode: importCode,
          };

          // Get PYTHONPATH environment variable
          info.python.PYTHONPATH = process.env.PYTHONPATH || '(not set)';
          info.python.PYTHON_VERSION = process.env.PYTHON_VERSION || '(not set)';

          resolve(NextResponse.json(info, { status: 200 }));
        });
      });

      pythonProcess.on('error', (err) => {
        info.python.available = false;
        info.python.error = err.message;
        resolve(NextResponse.json(info, { status: 200 }));
      });
    });
  } catch (error: unknown) {
    info.error = error instanceof Error ? error.message : String(error);
    return NextResponse.json(info, { status: 200 });
  }
}

