'use client'

import { useState, useCallback, useEffect } from 'react'
import PageLayout from '@/components/PageLayout'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { addGameToDefaultList, getOrCreateDefaultLists } from '@/lib/lists'
import { parseCSV, normalizeGameName, parseCSVBoolean, parseCSVYear } from '@/utils/csvParser'
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface CSVRow {
  [key: string]: string
}

interface ImportResult {
  game_name: string
  status: 'matched' | 'not_found' | 'error'
  game_id?: string
  error?: string
  csv_data: CSVRow
  search_attempts?: string[]
  matched_game_name?: string
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([])
  const [mapping, setMapping] = useState<{[key: string]: string}>({})
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'import' | 'results'>('upload')
  const [gameCount, setGameCount] = useState<number | null>(null)
  
  const router = useRouter()

  // Check how many games are in the database
  const checkGameCount = async () => {
    const { count } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
    
    setGameCount(count || 0)
  }

  useEffect(() => {
    checkGameCount()
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    
    // Parse CSV
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      
      try {
        const parseResult = parseCSV(text)
        
        if (parseResult.errors.length > 0) {
          setCsvParseErrors(parseResult.errors)
          console.warn('CSV parsing warnings:', parseResult.errors)
        } else {
          setCsvParseErrors([])
        }
        
        if (parseResult.data.length === 0) {
          alert('No valid data rows found in CSV file')
          return
        }
        
        setCsvHeaders(parseResult.headers)
        setCsvData(parseResult.data)
        
        // Auto-map common headers
        const autoMapping: {[key: string]: string} = {}
        parseResult.headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          
          if (lowerHeader.includes('name') || lowerHeader === 'title' || lowerHeader === 'game') {
            autoMapping.name = header
          } else if (lowerHeader.includes('year') || lowerHeader.includes('published')) {
            autoMapping.year = header
          } else if (lowerHeader.includes('owned') || lowerHeader.includes('own')) {
            autoMapping.owned = header
          } else if (lowerHeader.includes('played') || lowerHeader.includes('play')) {
            autoMapping.played = header
          }
        })
        
        setMapping(autoMapping)
        setStep('map')
        
      } catch (error) {
        console.error('Failed to parse CSV:', error)
        alert('Failed to parse CSV file. Please check that it\'s a valid CSV format.')
      }
    }
    reader.readAsText(selectedFile)
  }, [])

  const handleMapping = useCallback(() => {
    setStep('preview')
  }, [])

  const searchGame = async (gameName: string, year?: string): Promise<{id: string, name: string, search_attempts: string[]} | null> => {
    const normalizedName = normalizeGameName(gameName)
    if (!normalizedName.trim()) return null
    
    const searchAttempts: string[] = []
    
    try {
      // Try exact match with normalized name and year if provided
      if (year && !isNaN(parseInt(year))) {
        searchAttempts.push(`Exact match with year: "${normalizedName}" (${year})`)
        let { data, error } = await supabase
          .from('games')
          .select('id, name, year_published')
          .ilike('name', normalizedName)
          .eq('year_published', parseInt(year))
          .limit(1)
        
        if (error) {
          searchAttempts.push(`Database error on year search: ${error.message}`)
          throw error
        }
        
        if (data && data.length > 0) {
          return { ...data[0], search_attempts: searchAttempts }
        }
      }
      
      // Try exact match without year constraint
      searchAttempts.push(`Exact match: "${normalizedName}"`)
      let { data, error } = await supabase
        .from('games')
        .select('id, name')
        .ilike('name', normalizedName)
        .limit(1)
      
      if (error) {
        searchAttempts.push(`Database error on exact search: ${error.message}`)
        throw error
      }
      
      if (data && data.length > 0) {
        return { ...data[0], search_attempts: searchAttempts }
      }
      
      // If normalized name is different from original, try original too
      if (normalizedName !== gameName.trim()) {
        searchAttempts.push(`Original name: "${gameName.trim()}"`)
        const { data: originalData, error: originalError } = await supabase
          .from('games')
          .select('id, name')
          .ilike('name', gameName.trim())
          .limit(1)
        
        if (originalError) {
          searchAttempts.push(`Database error on original search: ${originalError.message}`)
        } else if (originalData && originalData.length > 0) {
          return { ...originalData[0], search_attempts: searchAttempts }
        }
      }
      
      // Try fuzzy match with first significant word
      const words = normalizedName.split(' ').filter(word => word.length > 2)
      if (words.length > 0) {
        const firstWord = words[0]
        searchAttempts.push(`Fuzzy match with first word: "${firstWord}"`)
        const { data: fuzzyData, error: fuzzyError } = await supabase
          .from('games')
          .select('id, name')
          .ilike('name', `%${firstWord}%`)
          .limit(5) // Get more results to see options
        
        if (fuzzyError) {
          searchAttempts.push(`Database error on fuzzy search: ${fuzzyError.message}`)
          throw fuzzyError
        }
        
        if (fuzzyData && fuzzyData.length > 0) {
          searchAttempts.push(`Found ${fuzzyData.length} fuzzy matches: ${fuzzyData.map(g => g.name).join(', ')}`)
          return { ...fuzzyData[0], search_attempts: searchAttempts }
        }
      }
      
      // Try without common articles
      const cleanedName = normalizedName.replace(/^(The|A|An)\s+/i, '').trim()
      if (cleanedName !== normalizedName && cleanedName.length > 0) {
        searchAttempts.push(`Without articles: "${cleanedName}"`)
        const { data: cleanData, error: cleanError } = await supabase
          .from('games')
          .select('id, name')
          .ilike('name', cleanedName)
          .limit(1)
        
        if (cleanError) {
          searchAttempts.push(`Database error on clean search: ${cleanError.message}`)
          throw cleanError
        }
        
        if (cleanData && cleanData.length > 0) {
          return { ...cleanData[0], search_attempts: searchAttempts }
        }
      }
      
      return { id: '', name: '', search_attempts: searchAttempts }
    } catch (error) {
      console.error('Search error for game:', gameName, error)
      return { id: '', name: '', search_attempts: [...searchAttempts, `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`] }
    }
  }

  const performImport = async () => {
    setImporting(true)
    setStep('import')
    
    try {
      console.log('Starting import...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error:', userError)
        throw new Error(`Authentication error: ${userError.message}`)
      }
      
      if (!user) {
        console.error('No user found')
        throw new Error('Not authenticated - please log in first')
      }
      
      console.log('User authenticated:', user.id)
      const results: ImportResult[] = []
      
      for (const row of csvData) {
        const gameName = row[mapping.name] || ''
        const gameYear = mapping.year ? parseCSVYear(row[mapping.year]) : undefined
        const ownedValue = mapping.owned ? parseCSVBoolean(row[mapping.owned]) : true
        const isOwned = ownedValue !== false // true or null (unknown) = import, false = skip
        
        console.log(`Processing: ${gameName} (owned: ${isOwned}, raw owned value: "${row[mapping.owned] || 'N/A'}")`)
        
        try {
          const game = await searchGame(gameName, gameYear?.toString())
          
          if (game && game.id) {
            console.log(`Found game: ${game.name} (${game.id})`)
            
            // Only add to library if the game is owned
            if (isOwned) {
              console.log(`Game is owned, proceeding to add to library: ${gameName}`)
              
              const libraryListId = '15369a6b-cabe-4e20-869d-0457f34ca424'
              console.log(`Using library list ID: ${libraryListId}`)
              
              // Check if already in library
              const { data: existingItem, error: checkError } = await supabase
                .from('game_list_items')
                .select('id')
                .eq('list_id', libraryListId)
                .eq('game_id', game.id)
                .single()
              
              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
                console.error('Error checking existing library item:', checkError)
                throw checkError
              }
              
              if (!existingItem) {
                console.log(`Adding to library: ${gameName}`)
                
                const playedValue = mapping.played ? parseCSVBoolean(row[mapping.played]) : false
                
                // Add directly to game_list_items table
                const { data: insertData, error: insertError } = await supabase
                  .from('game_list_items')
                  .insert({
                    list_id: libraryListId,
                    game_id: game.id,
                    played_it: playedValue === true,
                    ranking: null, // This is for list ordering, not game ratings
                    score: null
                  })
                  .select()
                
                if (insertError) {
                  console.error('Error inserting into game_list_items:', insertError)
                  throw new Error(`Failed to add game to library: ${insertError.message}`)
                }
                
                console.log(`Successfully added to library: ${gameName}`, insertData)
              } else {
                console.log(`Game already in library: ${gameName}`)
              }
            } else {
              console.log(`Skipping library addition for unowned game: ${gameName} (raw value: "${row[mapping.owned] || 'N/A'}")`)
            }
            
            results.push({
              game_name: gameName,
              status: 'matched',
              game_id: game.id,
              matched_game_name: game.name,
              search_attempts: game.search_attempts,
              csv_data: row
            })
          } else {
            console.log(`No game found for: ${gameName}`)
            results.push({
              game_name: gameName,
              status: 'not_found',
              search_attempts: game?.search_attempts || [`No search performed for: "${gameName}"`],
              csv_data: row
            })
          }
        } catch (error) {
          console.error('Import error for game:', gameName, error)
          results.push({
            game_name: gameName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            search_attempts: [`Error occurred while processing: ${error instanceof Error ? error.message : 'Unknown error'}`],
            csv_data: row
          })
        }
      }
      
      console.log('Import completed. Results:', results.length)
      setResults(results)
      setStep('results')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const commonMappings = [
    { label: 'Game Name', key: 'name', required: true },
    { label: 'Year Published', key: 'year', required: false },
    { label: 'Owned (true/false/Unknown)', key: 'owned', required: false },
    { label: 'Played It (true/false)', key: 'played', required: false }
  ]

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Import Library from CSV</h1>
          <div className="text-sm text-gray-500">
            Database: {gameCount !== null ? `${gameCount.toLocaleString()} games` : 'Loading...'}
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Upload', 'Map Fields', 'Preview', 'Import', 'Results'].map((stepName, index) => {
              const stepKey = ['upload', 'map', 'preview', 'import', 'results'][index]
              const isActive = step === stepKey
              const isCompleted = ['upload', 'map', 'preview', 'import', 'results'].indexOf(step) > index
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-primary-500 text-white' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                    {stepName}
                  </span>
                  {index < 4 && <div className="w-12 h-px bg-gray-200 mx-4" />}
                </div>
              )
            })}
          </div>
        </div>

        {step === 'upload' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Select your board game CSV file to import</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
              >
                Choose CSV File
              </label>
              {file && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    Selected: {file.name} ({csvData.length} rows)
                  </p>
                  {csvParseErrors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">CSV Parsing Warnings</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              {csvParseErrors.slice(0, 5).map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                              {csvParseErrors.length > 5 && (
                                <li>... and {csvParseErrors.length - 5} more warnings</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Map CSV Fields</h2>
            <p className="text-gray-600 mb-6">Match your CSV columns to the appropriate fields:</p>
            
            <div className="space-y-4">
              {commonMappings.map((field) => (
                <div key={field.key} className="flex items-center gap-4">
                  <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleMapping}
                disabled={!mapping.name}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Preview Import</h2>
            <p className="text-gray-600 mb-6">Review the first few rows before importing:</p>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game Name
                    </th>
                    {mapping.year && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                    )}
                    {mapping.owned && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owned
                      </th>
                    )}
                    {mapping.played && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Played It
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[mapping.name]}
                      </td>
                      {mapping.year && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[mapping.year]}
                        </td>
                      )}
                      {mapping.owned && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[mapping.owned]}
                        </td>
                      )}
                      {mapping.played && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[mapping.played]}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Import Notes</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Games will be matched by name (and year if provided) to our database</li>
                      <li>Special characters, quotes, and Unicode will be handled automatically</li>
                      <li>Year helps identify the correct version when multiple editions exist</li>
                      <li>Only games that exist in our database will be imported</li>
                      <li><strong>Only owned games will be added to your Library</strong></li>
                      <li>"Unknown" ownership status is treated as owned and will be imported</li>
                      <li>Games already in your library will be skipped</li>
                      <li>Played status will be stored in your Library</li>
                      <li>You can add 1-10 ratings later using the Rankings page</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('map')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={performImport}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Start Import
              </button>
            </div>
          </div>
        )}

        {step === 'import' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Importing Games...</h2>
            <p className="text-gray-600">Please wait while we match and import your games.</p>
          </div>
        )}

        {step === 'results' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Import Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">
                  {results.filter(r => r.status === 'matched').length}
                </div>
                <div className="text-sm text-green-600">Successfully Imported</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-800">
                  {results.filter(r => r.status === 'not_found').length}
                </div>
                <div className="text-sm text-yellow-600">Not Found</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-800">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.status === 'matched' ? 'bg-green-50 border-green-200' :
                  result.status === 'not_found' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.status === 'matched' && <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {result.status === 'not_found' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                    {result.status === 'error' && <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        CSV: "{result.game_name}"
                        {result.matched_game_name && result.matched_game_name !== result.game_name && (
                          <span className="text-green-600"> → Matched: "{result.matched_game_name}"</span>
                        )}
                      </div>
                      
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">{result.error}</div>
                      )}
                      
                      {result.search_attempts && result.search_attempts.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Show search attempts ({result.search_attempts.length})
                          </summary>
                          <div className="mt-1 text-xs text-gray-600 pl-4 border-l-2 border-gray-200">
                            {result.search_attempts.map((attempt, i) => (
                              <div key={i} className="py-0.5">{i + 1}. {attempt}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setCsvData([])
                  setResults([])
                  setMapping({})
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Import Another File
              </button>
              <button
                onClick={() => router.push('/library')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                View My Library
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
