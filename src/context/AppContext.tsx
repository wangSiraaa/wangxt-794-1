import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { UserRole } from '@/types'
import type {
  Freezer,
  Shelf,
  Box,
  Sample,
  BoxMatrix,
  PrintQueueItem,
  RecentQuery,
  MoveRecord,
  SearchFilters
} from '@/types'
import { storage } from '@/services/storage'
import { rules } from '@/services/rules'
import { mockData } from '@/services/mockData'
import { generateId } from '@/utils'

interface AppState {
  freezers: Freezer[]
  shelves: Shelf[]
  boxes: Box[]
  samples: Sample[]
  moveRecords: MoveRecord[]
  boxMatrices: Record<string, BoxMatrix>
  printQueue: PrintQueueItem[]
  recentQueries: RecentQuery[]
  currentRole: UserRole
  selectedBoxId: string | null
  selectedSample: Sample | null
  highlightedPosition: { row: number; col: number } | null
  searchResults: Sample[]
}

type AppAction =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_SAMPLE'; payload: Sample }
  | { type: 'UPDATE_SAMPLE'; payload: Sample }
  | { type: 'DELETE_SAMPLE'; payload: string }
  | { type: 'ADD_FREEZER'; payload: Freezer }
  | { type: 'UPDATE_FREEZER'; payload: Freezer }
  | { type: 'DELETE_FREEZER'; payload: string }
  | { type: 'ADD_SHELF'; payload: Shelf }
  | { type: 'UPDATE_SHELF'; payload: Shelf }
  | { type: 'DELETE_SHELF'; payload: string }
  | { type: 'ADD_BOX'; payload: Box }
  | { type: 'UPDATE_BOX'; payload: Box }
  | { type: 'DELETE_BOX'; payload: string }
  | { type: 'UPDATE_BOX_MATRIX'; payload: BoxMatrix }
  | { type: 'ADD_TO_PRINT_QUEUE'; payload: { sample: Sample; copies?: number } }
  | { type: 'REMOVE_FROM_PRINT_QUEUE'; payload: string }
  | { type: 'CLEAR_PRINT_QUEUE' }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SELECT_BOX'; payload: string | null }
  | { type: 'SELECT_SAMPLE'; payload: Sample | null }
  | { type: 'HIGHLIGHT_POSITION'; payload: { row: number; col: number } | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: Sample[] }
  | { type: 'ADD_RECENT_QUERY'; payload: RecentQuery }
  | { type: 'ADD_MOVE_RECORD'; payload: MoveRecord }
  | { type: 'REFRESH_DATA' }

const initialState: AppState = {
  freezers: [],
  shelves: [],
  boxes: [],
  samples: [],
  moveRecords: [],
  boxMatrices: {},
  printQueue: [],
  recentQueries: [],
  currentRole: UserRole.RESEARCHER,
  selectedBoxId: null,
  selectedSample: null,
  highlightedPosition: null,
  searchResults: []
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload }

    case 'ADD_SAMPLE': {
      const samples = [...state.samples, action.payload]
      const matrix = state.boxMatrices[action.payload.boxPosition.boxId]
      if (matrix) {
        const newMatrix = { ...matrix }
        newMatrix.samples = newMatrix.samples.map((row, ri) =>
          ri === action.payload.position.row
            ? row.map((cell, ci) =>
                ci === action.payload.position.col ? action.payload : cell
              )
            : row
        )
        return {
          ...state,
          samples,
          boxMatrices: { ...state.boxMatrices, [newMatrix.boxId]: newMatrix }
        }
      }
      return { ...state, samples }
    }

    case 'UPDATE_SAMPLE': {
      const samples = state.samples.map(s =>
        s.id === action.payload.id ? action.payload : s
      )
      const matrix = state.boxMatrices[action.payload.boxPosition.boxId]
      if (matrix) {
        const newMatrix = { ...matrix }
        newMatrix.samples = newMatrix.samples.map((row, ri) =>
          ri === action.payload.position.row
            ? row.map((cell, ci) =>
                ci === action.payload.position.col ? action.payload : cell
              )
            : row
        )
        return {
          ...state,
          samples,
          boxMatrices: { ...state.boxMatrices, [newMatrix.boxId]: newMatrix }
        }
      }
      return { ...state, samples }
    }

    case 'DELETE_SAMPLE': {
      const sample = state.samples.find(s => s.id === action.payload)
      const samples = state.samples.filter(s => s.id !== action.payload)
      if (sample) {
        const matrix = state.boxMatrices[sample.boxPosition.boxId]
        if (matrix) {
          const newMatrix = { ...matrix }
          newMatrix.samples = newMatrix.samples.map((row, ri) =>
            ri === sample.position.row
              ? row.map((cell, ci) => (ci === sample.position.col ? null : cell))
              : row
          )
          return {
            ...state,
            samples,
            boxMatrices: { ...state.boxMatrices, [newMatrix.boxId]: newMatrix }
          }
        }
      }
      return { ...state, samples }
    }

    case 'ADD_FREEZER':
      return { ...state, freezers: [...state.freezers, action.payload] }

    case 'UPDATE_FREEZER':
      return {
        ...state,
        freezers: state.freezers.map(f =>
          f.id === action.payload.id ? action.payload : f
        )
      }

    case 'DELETE_FREEZER':
      return {
        ...state,
        freezers: state.freezers.filter(f => f.id !== action.payload)
      }

    case 'ADD_SHELF':
      return { ...state, shelves: [...state.shelves, action.payload] }

    case 'UPDATE_SHELF':
      return {
        ...state,
        shelves: state.shelves.map(s =>
          s.id === action.payload.id ? action.payload : s
        )
      }

    case 'DELETE_SHELF':
      return {
        ...state,
        shelves: state.shelves.filter(s => s.id !== action.payload)
      }

    case 'ADD_BOX': {
      const newMatrix: BoxMatrix = {
        boxId: action.payload.id,
        rows: action.payload.rows,
        cols: action.payload.cols,
        samples: Array(action.payload.rows)
          .fill(null)
          .map(() => Array(action.payload.cols).fill(null))
      }
      return {
        ...state,
        boxes: [...state.boxes, action.payload],
        boxMatrices: { ...state.boxMatrices, [newMatrix.boxId]: newMatrix }
      }
    }

    case 'UPDATE_BOX':
      return {
        ...state,
        boxes: state.boxes.map(b =>
          b.id === action.payload.id ? action.payload : b
        )
      }

    case 'DELETE_BOX': {
      const newMatrices = { ...state.boxMatrices }
      delete newMatrices[action.payload]
      return {
        ...state,
        boxes: state.boxes.filter(b => b.id !== action.payload),
        boxMatrices: newMatrices
      }
    }

    case 'UPDATE_BOX_MATRIX':
      return {
        ...state,
        boxMatrices: { ...state.boxMatrices, [action.payload.boxId]: action.payload }
      }

    case 'ADD_TO_PRINT_QUEUE': {
      const newQueue = rules.addToPrintQueue(
        state.printQueue,
        action.payload.sample,
        action.payload.copies
      )
      return { ...state, printQueue: newQueue }
    }

    case 'REMOVE_FROM_PRINT_QUEUE':
      return {
        ...state,
        printQueue: state.printQueue.filter(q => q.id !== action.payload)
      }

    case 'CLEAR_PRINT_QUEUE':
      return { ...state, printQueue: [] }

    case 'SET_ROLE':
      return { ...state, currentRole: action.payload }

    case 'SELECT_BOX':
      return { ...state, selectedBoxId: action.payload, selectedSample: null, highlightedPosition: null }

    case 'SELECT_SAMPLE':
      return { ...state, selectedSample: action.payload }

    case 'HIGHLIGHT_POSITION':
      return { ...state, highlightedPosition: action.payload }

    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload }

    case 'ADD_RECENT_QUERY':
      return {
        ...state,
        recentQueries: [action.payload, ...state.recentQueries].slice(0, 20)
      }

    case 'ADD_MOVE_RECORD':
      return { ...state, moveRecords: [...state.moveRecords, action.payload] }

    case 'REFRESH_DATA': {
      const data = storage.load()
      return {
        ...state,
        freezers: data.freezers,
        shelves: data.shelves,
        boxes: data.boxes,
        samples: rules.updateSampleStatusForExpiration(data.samples),
        moveRecords: data.moveRecords,
        boxMatrices: data.boxMatrices,
        printQueue: data.printQueue,
        recentQueries: data.recentQueries
      }
    }

    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  loadStorage: () => void
  saveStorage: () => void
  searchSamples: (filters: SearchFilters) => Sample[]
  locateSample: (sampleId: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const loadStorage = () => {
    mockData.initDemoData()
    dispatch({ type: 'REFRESH_DATA' })
  }

  const saveStorage = () => {
    const data = storage.load()
    data.freezers = state.freezers
    data.shelves = state.shelves
    data.boxes = state.boxes
    data.samples = state.samples
    data.moveRecords = state.moveRecords
    data.boxMatrices = state.boxMatrices
    data.printQueue = state.printQueue
    data.recentQueries = state.recentQueries
    storage.save(data)
  }

  const searchSamples = (filters: SearchFilters): Sample[] => {
    const results = storage.searchSamples(filters)
    const updatedResults = rules.updateSampleStatusForExpiration(results)
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: updatedResults })

    const query: RecentQuery = {
      id: generateId('q'),
      filters,
      queryAt: new Date().toISOString(),
      resultCount: updatedResults.length
    }
    dispatch({ type: 'ADD_RECENT_QUERY', payload: query })
    storage.saveRecentQuery(query)

    return updatedResults
  }

  const locateSample = (sampleId: string) => {
    const sample = state.samples.find(s => s.id === sampleId)
    if (sample) {
      dispatch({ type: 'SELECT_BOX', payload: sample.boxPosition.boxId })
      dispatch({ type: 'SELECT_SAMPLE', payload: sample })
      dispatch({ type: 'HIGHLIGHT_POSITION', payload: sample.position })

      setTimeout(() => {
        dispatch({ type: 'HIGHLIGHT_POSITION', payload: null })
      }, 3000)
    }
  }

  useEffect(() => {
    loadStorage()
  }, [])

  useEffect(() => {
    if (state.freezers.length > 0) {
      saveStorage()
    }
  }, [
    state.freezers,
    state.shelves,
    state.boxes,
    state.samples,
    state.moveRecords,
    state.boxMatrices,
    state.printQueue,
    state.recentQueries
  ])

  return (
    <AppContext.Provider
      value={{ state, dispatch, loadStorage, saveStorage, searchSamples, locateSample }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
