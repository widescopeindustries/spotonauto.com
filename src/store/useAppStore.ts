"use client";
import { create } from 'zustand'

interface Vehicle {
  year: string
  make: string
  model: string
}

interface AppState {
  activeSection: string
  setActiveSection: (section: string) => void
  selectedVehicle: Vehicle | null
  setSelectedVehicle: (vehicle: Vehicle | null) => void
  isExploded: boolean
  setIsExploded: (value: boolean) => void
  isScanning: boolean
  setIsScanning: (value: boolean) => void
  garageVehicles: Vehicle[]
  addGarageVehicle: (vehicle: Vehicle) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),
  selectedVehicle: null,
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  isExploded: false,
  setIsExploded: (value) => set({ isExploded: value }),
  isScanning: false,
  setIsScanning: (value) => set({ isScanning: value }),
  garageVehicles: [],
  addGarageVehicle: (vehicle) =>
    set((state) => ({
      garageVehicles: [...state.garageVehicles, vehicle],
    })),
}))