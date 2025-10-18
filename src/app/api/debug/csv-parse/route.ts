import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM/gviz/tq?tqx=out:csv&sheet=K15'
    
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const csvText = await response.text()
    
    // Debug: show first 500 characters
    const preview = csvText.substring(0, 500)
    
    // Parse CSV exactly like in google-sheets.ts
    const lines = csvText.split('\n').filter(line => line.trim())
    const data: any[][] = []
    
    for (const line of lines) {
      // Simple CSV parsing (handles quoted commas)
      const values: string[] = []
      let currentValue = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      
      // Add the last value
      values.push(currentValue.trim())
      data.push(values)
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        csvLength: csvText.length,
        linesCount: lines.length,
        preview: preview,
        firstLine: lines[0],
        parsedRows: data.length,
        firstParsedRow: data[0],
        sampleDataRows: data.slice(0, 3)
      }
    })
    
  } catch (error) {
    console.error('CSV parse debug error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message 
      },
      { status: 500 }
    )
  }
}