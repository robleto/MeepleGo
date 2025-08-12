/**
 * Robust CSV parser that handles special characters, quotes, and escaped values
 */

interface CSVRow {
  [key: string]: string
}

interface ParseResult {
  headers: string[]
  data: CSVRow[]
  errors: string[]
}

/**
 * Parse a single CSV line, handling quoted values and escaped characters
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes) {
        // Check if this is an escaped quote
        if (nextChar === '"') {
          current += '"'
          i += 2 // Skip both quotes
          continue
        } else {
          // End of quoted section
          inQuotes = false
        }
      } else {
        // Start of quoted section
        inQuotes = true
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator - add current field and start new one
      result.push(current.trim())
      current = ''
    } else {
      // Regular character
      current += char
    }

    i++
  }

  // Add the last field
  result.push(current.trim())

  return result
}

/**
 * Clean and normalize field values
 */
function cleanFieldValue(value: string): string {
  return value
    .trim()
    // Remove surrounding quotes if they exist
    .replace(/^["']|["']$/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean and normalize header names
 */
function cleanHeaderName(header: string): string {
  return cleanFieldValue(header)
    // Remove common prefixes/suffixes that might interfere
    .replace(/^(bgg_|boardgamegeek_|bg_)/i, '')
    .replace(/(_id|_name)$/i, '')
    // Normalize common variations
    .replace(/^(game_?)?name$/i, 'name')
    .replace(/^(year_?)?(published|release|pub)$/i, 'year')
    .replace(/^(is_?)?owned$/i, 'owned')
    .replace(/^(has_?)?played$/i, 'played')
    .replace(/^rating$/i, 'rating')
}

/**
 * Parse CSV text with robust handling of special characters
 */
export function parseCSV(csvText: string): ParseResult {
  const errors: string[] = []
  
  if (!csvText || !csvText.trim()) {
    return { headers: [], data: [], errors: ['CSV file is empty'] }
  }

  try {
    // Split into lines, handling different line ending types
    const lines = csvText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length === 0) {
      return { headers: [], data: [], errors: ['No valid lines found in CSV'] }
    }

    // Parse header row
    const rawHeaders = parseCSVLine(lines[0])
    const headers = rawHeaders.map(cleanHeaderName)
    
    // Check for duplicate headers
    const headerCounts = new Map<string, number>()
    headers.forEach(header => {
      const count = headerCounts.get(header) || 0
      headerCounts.set(header, count + 1)
    })
    
    // Deduplicate headers by adding numbers
    const finalHeaders: string[] = []
    const usedHeaders = new Map<string, number>()
    
    headers.forEach(header => {
      if (!header) {
        finalHeaders.push(`column_${finalHeaders.length + 1}`)
        return
      }
      
      if (headerCounts.get(header)! > 1) {
        const count = (usedHeaders.get(header) || 0) + 1
        usedHeaders.set(header, count)
        finalHeaders.push(`${header}_${count}`)
      } else {
        finalHeaders.push(header)
      }
    })

    // Parse data rows
    const data: CSVRow[] = []
    
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      
      try {
        const values = parseCSVLine(line)
        
        // Skip empty rows
        if (values.every(val => !val.trim())) {
          continue
        }
        
        const row: CSVRow = {}
        
        // Map values to headers, handling mismatched column counts
        finalHeaders.forEach((header, index) => {
          const rawValue = values[index] || ''
          row[header] = cleanFieldValue(rawValue)
        })
        
        // Warn about mismatched column counts
        if (values.length !== finalHeaders.length) {
          errors.push(`Line ${lineIndex + 1}: Expected ${finalHeaders.length} columns, found ${values.length}`)
        }
        
        data.push(row)
      } catch (error) {
        errors.push(`Line ${lineIndex + 1}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { headers: finalHeaders, data, errors }
    
  } catch (error) {
    return { 
      headers: [], 
      data: [], 
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    }
  }
}

/**
 * Normalize game name for better matching
 */
/**
 * Decode HTML entities in text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  
  return text
    // Common named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Numeric entities (decimal)
    .replace(/&#(\d+);/g, (match, code) => {
      try {
        return String.fromCharCode(parseInt(code, 10))
      } catch {
        return match
      }
    })
    // Numeric entities (hexadecimal)
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16))
      } catch {
        return match
      }
    })
}

export function normalizeGameName(name: string): string {
  if (!name) return ''
  
  return decodeHtmlEntities(name)
    .trim()
    // Handle common encoding issues
    .replace(/â€™/g, "'") // Smart apostrophe
    .replace(/â€œ/g, '"') // Smart quote open
    .replace(/â€/g, '"')  // Smart quote close
    .replace(/â€"/g, '–') // En dash
    .replace(/â€"/g, '—') // Em dash
    // Normalize apostrophes and quotes
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse boolean values from CSV with common variations
 */
export function parseCSVBoolean(value: string): boolean | null {
  if (!value || !value.trim()) return null
  
  const normalized = value.toLowerCase().trim()
  
  // True values
  if (['true', 't', 'yes', 'y', '1', 'on', 'owned', 'played'].includes(normalized)) {
    return true
  }
  
  // False values  
  if (['false', 'f', 'no', 'n', '0', 'off', 'unknown', 'not owned', 'not played'].includes(normalized)) {
    return false
  }
  
  // Try to parse as number
  const num = parseFloat(normalized)
  if (!isNaN(num)) {
    return num > 0
  }
  
  return null
}

/**
 * Extract year from various formats
 */
export function parseCSVYear(value: string): number | null {
  if (!value || !value.trim()) return null
  
  // Try direct number parse
  const direct = parseInt(value.trim())
  if (!isNaN(direct) && direct > 1800 && direct < 2100) {
    return direct
  }
  
  // Extract 4-digit year from string
  const yearMatch = value.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) {
    return parseInt(yearMatch[1])
  }
  
  return null
}
