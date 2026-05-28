import { createContext, useContext, useEffect, useState } from "react";

export interface GlobalFilters {
  periodo: string;
  departamento: string;
  estadoProyecto: string;
  avanceProyecto: string;
  okrId: string;
}

export interface FilterPreset {
  id: string;
  nombre: string;
  filters: GlobalFilters;
  creadoEn: string;
}

interface FiltersContextType {
  filters: GlobalFilters;
  presets: FilterPreset[];
  setFilter: (key: keyof GlobalFilters, value: string) => void;
  clearFilters: () => void;
  applyPreset: (presetId: string) => void;
  savePreset: (nombre: string) => void;
  deletePreset: (presetId: string) => void;
}

const DEFAULT_FILTERS: GlobalFilters = {
  periodo: "todos",
  departamento: "todos",
  estadoProyecto: "todos",
  avanceProyecto: "todos",
  okrId: "todos",
};

const STORAGE_KEY = "mte-global-filters";
const PRESETS_KEY = "mte-filter-presets";

const FiltersContext = createContext<FiltersContextType>({
  filters: DEFAULT_FILTERS,
  presets: [],
  setFilter: () => {},
  clearFilters: () => {},
  applyPreset: () => {},
  savePreset: () => {},
  deletePreset: () => {},
});

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_FILTERS, ...JSON.parse(stored) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  const setFilter = (key: keyof GlobalFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const applyPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (preset) setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
  };
  const savePreset = (nombre: string) => {
    const cleanName = nombre.trim();
    if (!cleanName) return;
    const preset: FilterPreset = {
      id: `FP-${Date.now()}`,
      nombre: cleanName,
      filters,
      creadoEn: new Date().toISOString(),
    };
    setPresets((current) => [preset, ...current.filter((item) => item.nombre.toLowerCase() !== cleanName.toLowerCase())].slice(0, 8));
  };
  const deletePreset = (presetId: string) => {
    setPresets((current) => current.filter((preset) => preset.id !== presetId));
  };

  return (
    <FiltersContext.Provider value={{ filters, presets, setFilter, clearFilters, applyPreset, savePreset, deletePreset }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  return useContext(FiltersContext);
}
