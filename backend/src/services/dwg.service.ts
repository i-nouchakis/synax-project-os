import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

interface ConversionResult {
  success: boolean;
  outputPath?: string;
  outputFormat?: string;
  error?: string;
}

/**
 * DWG Conversion Service
 * Uses LibreDWG (dwgread, dwg2dxf) for conversion
 * Falls back to storing original if tools not available
 */
class DWGService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'synax-dwg');
  }

  /**
   * Check if LibreDWG tools are available
   */
  async checkLibreDWG(): Promise<boolean> {
    try {
      await execAsync('dwg2dxf --version 2>/dev/null');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if dwg2SVG (direct SVG converter) is available
   */
  async checkDwg2Svg(): Promise<boolean> {
    try {
      await execAsync('dwg2SVG --version 2>/dev/null');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if LibreCAD dwg2dxf is available
   */
  async checkLibreCAD(): Promise<boolean> {
    try {
      await execAsync('which libredwg 2>/dev/null || which dwgrewrite 2>/dev/null');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check available conversion tools
   */
  async getAvailableTools(): Promise<string[]> {
    const tools: string[] = [];

    // Check LibreDWG dwg2dxf
    if (await this.checkLibreDWG()) {
      tools.push('dwg2dxf');
    }

    // Check LibreDWG dwg2SVG (direct converter)
    if (await this.checkDwg2Svg()) {
      tools.push('dwg2SVG');
    }

    // Check for ODA File Converter (if installed)
    try {
      await execAsync('which ODAFileConverter 2>/dev/null');
      tools.push('oda');
    } catch {
      // Not available
    }

    // Check for QCAD
    try {
      await execAsync('which qcad 2>/dev/null');
      tools.push('qcad');
    } catch {
      // Not available
    }

    return tools;
  }

  /**
   * Convert DWG to DXF using LibreDWG
   */
  async dwgToDxf(inputPath: string): Promise<ConversionResult> {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      const inputFilename = path.basename(inputPath, '.dwg');
      const outputPath = path.join(this.tempDir, `${inputFilename}-${Date.now()}.dxf`);

      // Try dwg2dxf (LibreDWG tool)
      try {
        await execAsync(`dwg2dxf -o "${outputPath}" "${inputPath}"`);

        // Verify output exists
        await fs.access(outputPath);

        return {
          success: true,
          outputPath,
          outputFormat: 'dxf',
        };
      } catch (err) {
        // dwg2dxf might have different syntax
        try {
          await execAsync(`dwg2dxf "${inputPath}" "${outputPath}"`);
          await fs.access(outputPath);
          return {
            success: true,
            outputPath,
            outputFormat: 'dxf',
          };
        } catch {
          throw err;
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DWG to DXF conversion failed',
      };
    }
  }

  /**
   * Convert DXF to SVG
   * Uses a simple approach - for complex drawings, consider using a proper library
   */
  async dxfToSvg(inputPath: string): Promise<ConversionResult> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });

      const inputFilename = path.basename(inputPath, '.dxf');
      const outputPath = path.join(this.tempDir, `${inputFilename}-${Date.now()}.svg`);

      // Try using QCAD if available
      try {
        await execAsync(`qcad -no-gui -o "${outputPath}" "${inputPath}"`);
        await fs.access(outputPath);
        return {
          success: true,
          outputPath,
          outputFormat: 'svg',
        };
      } catch {
        // QCAD not available, try other methods
      }

      // Try using LibreCAD if available
      try {
        await execAsync(`librecad "${inputPath}" -o "${outputPath}"`);
        await fs.access(outputPath);
        return {
          success: true,
          outputPath,
          outputFormat: 'svg',
        };
      } catch {
        // LibreCAD not available
      }

      // Fallback: return DXF as is (frontend can try to render)
      return {
        success: false,
        error: 'No SVG conversion tool available. DXF file preserved.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DXF to SVG conversion failed',
      };
    }
  }

  /**
   * Direct DWG to SVG conversion using dwg2SVG
   */
  async dwgToSvgDirect(inputPath: string): Promise<ConversionResult> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });

      const inputFilename = path.basename(inputPath, '.dwg');
      const outputPath = path.join(this.tempDir, `${inputFilename}-${Date.now()}.svg`);

      // dwg2SVG outputs to stdout, so we redirect to file
      await execAsync(`dwg2SVG "${inputPath}" > "${outputPath}"`);
      await fs.access(outputPath);

      // Verify output has content
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Empty SVG output');
      }

      return {
        success: true,
        outputPath,
        outputFormat: 'svg',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct DWG to SVG conversion failed',
      };
    }
  }

  /**
   * Full DWG to SVG conversion pipeline
   * Tries direct conversion first, then falls back to DWG→DXF→SVG
   */
  async convertDwgToSvg(inputBuffer: Buffer, filename: string): Promise<{
    success: boolean;
    format: 'svg' | 'dxf' | 'dwg';
    buffer: Buffer;
    error?: string;
  }> {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Write input to temp file
      const inputPath = path.join(this.tempDir, `input-${Date.now()}.dwg`);
      await fs.writeFile(inputPath, inputBuffer);

      // Try direct DWG to SVG first (fastest)
      if (await this.checkDwg2Svg()) {
        const directResult = await this.dwgToSvgDirect(inputPath);
        if (directResult.success && directResult.outputPath) {
          const svgBuffer = await fs.readFile(directResult.outputPath);
          await this.cleanup([inputPath, directResult.outputPath]);
          return {
            success: true,
            format: 'svg',
            buffer: svgBuffer,
          };
        }
      }

      // Fallback: Try DWG to DXF
      const dxfResult = await this.dwgToDxf(inputPath);

      if (dxfResult.success && dxfResult.outputPath) {
        // Try DXF to SVG
        const svgResult = await this.dxfToSvg(dxfResult.outputPath);

        if (svgResult.success && svgResult.outputPath) {
          const svgBuffer = await fs.readFile(svgResult.outputPath);

          // Cleanup
          await this.cleanup([inputPath, dxfResult.outputPath, svgResult.outputPath]);

          return {
            success: true,
            format: 'svg',
            buffer: svgBuffer,
          };
        }

        // Return DXF if SVG conversion failed
        const dxfBuffer = await fs.readFile(dxfResult.outputPath);
        await this.cleanup([inputPath, dxfResult.outputPath]);

        return {
          success: true,
          format: 'dxf',
          buffer: dxfBuffer,
          error: svgResult.error,
        };
      }

      // Cleanup and return original DWG
      await this.cleanup([inputPath]);

      return {
        success: false,
        format: 'dwg',
        buffer: inputBuffer,
        error: dxfResult.error || 'No conversion tools available',
      };
    } catch (error) {
      return {
        success: false,
        format: 'dwg',
        buffer: inputBuffer,
        error: error instanceof Error ? error.message : 'Conversion failed',
      };
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(paths: string[]): Promise<void> {
    for (const p of paths) {
      try {
        await fs.unlink(p);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get conversion status/info
   */
  async getStatus(): Promise<{
    available: boolean;
    tools: string[];
    message: string;
  }> {
    const tools = await this.getAvailableTools();

    return {
      available: tools.length > 0,
      tools,
      message: tools.length > 0
        ? `DWG conversion available using: ${tools.join(', ')}`
        : 'No DWG conversion tools installed. Install LibreDWG: apt install libredwg-tools',
    };
  }
}

export const dwgService = new DWGService();
