(function(global){
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  const hasWindow = !isNode && typeof window !== 'undefined' && typeof window.document !== 'undefined';
  let DexieLib = null;
  if (hasWindow) {
    DexieLib = global.Dexie || (typeof require === 'function' ? require('dexie') : undefined);
  }

  let db = null;
  if (DexieLib) {
    db = new DexieLib('ProyectoBarackDB');
    db.version(1).stores({ sinoptico: '++id,parentId,nombre,orden' });
  }
  const memory = [];

  const channelName = 'sinoptico-channel';
  const channel = hasWindow && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(channelName)
    : null;

  function notify(){
    if (channel && channel.postMessage) {
      channel.postMessage({ type: 'DATA_CHANGED' });
    }
  }

  async function getAll(){
    if (db) {
      try { return await db.sinoptico.toArray(); } catch(e){ console.error(e); }
    }
    return memory.slice();
  }

  async function addNode(node){
    if (db) {
      try {
        const id = await db.sinoptico.add(node);
        notify();
        return id;
      } catch(e){
        console.error(e);
      }
    }
    memory.push(Object.assign({}, node));
    notify();
    return node.id;
  }

  async function updateNode(id, changes){
    if (db) {
      try {
        await db.sinoptico.update(id, changes);
        notify();
        return;
      } catch(e){
        console.error(e);
      }
    }
    const item = memory.find(x => x.id === id);
    if (item) Object.assign(item, changes);
    notify();
  }

  async function deleteNode(id){
    if (db) {
      try {
        await db.sinoptico.delete(id);
        notify();
        return;
      } catch(e){
        console.error(e);
      }
    }
    const idx = memory.findIndex(x => x.id === id);
    if (idx >= 0) memory.splice(idx,1);
    notify();
  }

  function subscribeToChanges(handler){
    if (!channel) return;
    channel.addEventListener('message', ev => {
      if (ev.data && ev.data.type === 'DATA_CHANGED') handler();
    });
  }

  const api = { getAll, addNode, updateNode, deleteNode, subscribeToChanges };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.dataService = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
