(function(global){
  function loadHistory(key){
    if (typeof localStorage === 'undefined') return [];
    try {
      const arr = JSON.parse(localStorage.getItem(key));
      return Array.isArray(arr) ? arr : [];
    } catch(e){
      return [];
    }
  }

  function addHistoryEntry(key, data){
    if (typeof localStorage === 'undefined') return;
    const history = loadHistory(key);
    const copy = JSON.parse(JSON.stringify(data));
    history.push({ timestamp: new Date().toISOString(), data: copy });
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch(e){}
  }

  global.loadHistory = loadHistory;
  global.addHistoryEntry = addHistoryEntry;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadHistory, addHistoryEntry };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
