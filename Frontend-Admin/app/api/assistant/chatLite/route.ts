import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    const { mode } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 });
    }

    // Path to your Python script
    const pythonScriptPath = path.join(process.cwd(), 'ai.py');
    
    // Spawn Python process with the prompt as argument
    const pythonProcess = spawn('python', [pythonScriptPath, prompt, mode], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd() // Ensure we're in the right directory
    });

    // Collect output
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Wait for process to complete
    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          resolve(NextResponse.json({ 
            error: `Python script failed with code ${code}: ${errorOutput}` 
          }, { status: 500 }));
        } else {
          try {
            const result = JSON.parse(output);
            resolve(NextResponse.json(result));
          } catch (parseError) {
            console.error('Parse error:', parseError, 'Raw output:', output);
            resolve(NextResponse.json({ 
              error: 'Failed to parse Python output', 
              rawOutput: output 
            }, { status: 500 }));
          }
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('Process error:', error);
        resolve(NextResponse.json({ 
          error: `Failed to start Python process: ${error.message}` 
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Optional: GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'AI API endpoint is running. Use POST with { "prompt": "your question" }' 
  });
}