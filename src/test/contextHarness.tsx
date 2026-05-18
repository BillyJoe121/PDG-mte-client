import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { AuthProvider, useAuth } from '../app/context/AuthContext';
import { AuditProvider, useAudit } from '../app/context/AuditContext';
import { DataProvider, useData } from '../app/context/DataContext';
import { FiltersProvider, useGlobalFilters } from '../app/context/FiltersContext';

export function renderAuthHook() {
  let api: ReturnType<typeof useAuth>;
  function Probe() {
    api = useAuth();
    return null;
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  return () => api!;
}

export function renderAuditHook(wrapper?: ({ children }: { children: ReactNode }) => JSX.Element) {
  let api: ReturnType<typeof useAudit>;
  function Probe() {
    api = useAudit();
    return null;
  }
  const Wrapper = wrapper ?? (({ children }: { children: ReactNode }) => <>{children}</>);
  render(
    <Wrapper>
      <AuditProvider>
        <Probe />
      </AuditProvider>
    </Wrapper>
  );
  return () => api!;
}

export function renderDataHook() {
  let api: ReturnType<typeof useData>;
  function Probe() {
    api = useData();
    return null;
  }
  render(
    <DataProvider>
      <Probe />
    </DataProvider>
  );
  return () => api!;
}

export function renderFiltersHook() {
  let api: ReturnType<typeof useGlobalFilters>;
  function Probe() {
    api = useGlobalFilters();
    return null;
  }
  render(
    <FiltersProvider>
      <Probe />
    </FiltersProvider>
  );
  return () => api!;
}
