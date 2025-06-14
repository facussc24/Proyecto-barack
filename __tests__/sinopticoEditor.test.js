const { createSinopticoEditor } = require('../js/sinopticoEditor.js');

describe('SinopticoEditor', () => {
  let data;
  let editor;
  let ds;
  let counter;

  beforeEach(() => {
    data = [];
    counter = 0;
    ds = {
      addNode: jest.fn(),
      deleteNode: jest.fn(),
      updateNode: jest.fn(),
    };
    editor = createSinopticoEditor({
      getData: () => data,
      setData: d => { data = d; },
      generateId: () => `id${++counter}`,
      saveSinoptico: jest.fn(),
      loadData: jest.fn(),
      dataService: ds,
    });
  });

  test('addNode stores node and calls dataService', () => {
    const id = editor.addNode({ Tipo: 'Cliente', Descripción: 'A' });
    expect(id).toBe('id1');
    expect(data.length).toBe(1);
    expect(ds.addNode).toHaveBeenCalledWith(expect.objectContaining({ ID: 'id1' }));
  });

  test('updateNode updates data and calls dataService', () => {
    const id = editor.addNode({ Tipo: 'Insumo', Descripción: 'B' });
    editor.updateNode(id, { Descripción: 'C' });
    expect(data[0].Descripción).toBe('C');
    expect(ds.updateNode).toHaveBeenCalledWith('id1', expect.objectContaining({ Descripción: 'C', nombre: 'C' }));
  });

  test('deleteSubtree removes nodes and calls dataService', () => {
    const parent = editor.addNode({ Descripción: 'P' });
    const child = editor.addNode({ ParentID: parent, Descripción: 'C' });
    expect(data.length).toBe(2);
    editor.deleteSubtree(parent);
    expect(data.length).toBe(0);
    expect(ds.deleteNode).toHaveBeenCalledWith(parent);
    expect(ds.deleteNode).toHaveBeenCalledWith(child);
  });

  test('getNodes returns a copy', () => {
    const id = editor.addNode({ Descripción: 'x' });
    const nodes = editor.getNodes();
    expect(nodes).toEqual(data);
    expect(nodes).not.toBe(data);
  });
});
