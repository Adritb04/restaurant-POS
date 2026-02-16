export function getAPI() {
  const api = window.electronAPI || window.localElectronAPI;
  if (!api) {
    throw new Error(
      'No DB API found. Ensure preload exposes window.electronAPI OR load src/utils/localDB.js early to define window.localElectronAPI.'
    );
  }
  return api;
}
