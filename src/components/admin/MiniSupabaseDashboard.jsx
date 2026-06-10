import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

// Add CSS animation for toast
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Custom hook to detect media query
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}

// Style objects
const containerStyle = (isMobile) => ({
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
});

const cardStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const sectionStyle = (isMobile) => ({
  padding: isMobile ? '1rem' : '1.5rem',
});

const headingStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '1.5rem',
};

const inputStyle = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  transition: 'all 0.2s',
  fontSize: '0.875rem',
};

const buttonStyle = {
  backgroundColor: '#2563eb',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontWeight: '500',
  transition: 'background-color 0.2s',
  cursor: 'pointer',
  border: 'none',
  fontSize: '0.875rem',
};

const buttonDisabledStyle = {
  ...buttonStyle,
  backgroundColor: '#93c5fd',
  cursor: 'not-allowed',
};

const greenButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#16a34a',
};

const greenButtonDisabledStyle = {
  ...greenButtonStyle,
  backgroundColor: '#86efac',
  cursor: 'not-allowed',
};

const redButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#dc2626',
};

const redButtonDisabledStyle = {
  ...redButtonStyle,
  backgroundColor: '#fca5a5',
  cursor: 'not-allowed',
};

const grayButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#4b5563',
};

const grayButtonDisabledStyle = {
  ...grayButtonStyle,
  backgroundColor: '#9ca3af',
  cursor: 'not-allowed',
};

const backButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#4f46e5',
  marginBottom: '1rem',
};

const errorBoxStyle = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  color: '#b91c1c',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1rem',
};

const successBoxStyle = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #dcfce7',
  color: '#15803d',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1rem',
};

const warningBoxStyle = {
  backgroundColor: '#fefce8',
  border: '1px solid #fef08a',
  color: '#a16207',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1rem',
};

const schemaItemStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '0.75rem',
};

const tableItemStyle = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1e40af',
  borderRadius: '6px',
  padding: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const modalOverlayStyle = (isMobile) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: isMobile ? '1rem' : '2rem',
});

const modalContentStyle = (isMobile) => ({
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  maxWidth: isMobile ? '100%' : '32rem',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #d1d5db',
  fontSize: '0.875rem',
};

const tableHeaderStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #d1d5db',
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  fontWeight: '500',
  color: '#374151',
};

const tableCellStyle = {
  border: '1px solid #d1d5db',
  padding: '0.5rem 0.75rem',
  color: '#1f2937',
};

const toastStyle = (isMobile) => ({
  position: 'fixed',
  top: '1rem',
  right: '1rem',
  backgroundColor: '#10b981',
  color: 'white',
  padding: '0.875rem 1.25rem',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  zIndex: 60,
  fontSize: '0.875rem',
  fontWeight: '500',
  maxWidth: isMobile ? 'calc(100vw - 2rem)' : '20rem',
  animation: 'slideInRight 0.3s ease-out',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
});

export default function MiniSupabaseDashboard() {
  // Define isMobile using useMediaQuery
  const isMobile = useMediaQuery('(max-width: 640px)');
  const navigate = useNavigate();

  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalSchemas, setTotalSchemas] = useState(0);
  const [schemaName, setSchemaName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(null);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [tableName, setTableName] = useState('');
  const [createTableLoading, setCreateTableLoading] = useState(null);
  const [showAddTable, setShowAddTable] = useState(null);
  const [deleteTableLoading, setDeleteTableLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteSchema, setConfirmDeleteSchema] = useState(null);
  const [confirmDeleteRow, setConfirmDeleteRow] = useState(null);
  const [deleteRowLoading, setDeleteRowLoading] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [confirmUpdateRow, setConfirmUpdateRow] = useState(null);
  const [updateRowLoading, setUpdateRowLoading] = useState(null);
  const [addingRow, setAddingRow] = useState(null);
  const [addFormData, setAddFormData] = useState({});
  const [confirmAddRow, setConfirmAddRow] = useState(null);
  const [addRowLoading, setAddRowLoading] = useState(null);
  const [addingColumn, setAddingColumn] = useState(null);
  const [addColumnData, setAddColumnData] = useState({});
  const [confirmAddColumn, setConfirmAddColumn] = useState(null);
  const [addColumnLoading, setAddColumnLoading] = useState(null);
  const [confirmDeleteColumn, setConfirmDeleteColumn] = useState(null);
  const [deleteColumnLoading, setDeleteColumnLoading] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableDataLoading, setTableDataLoading] = useState(null);
  const [viewingTable, setViewingTable] = useState(null);
  const [showScratchPopup, setShowScratchPopup] = useState(null);
  const [scratchColumns, setScratchColumns] = useState([
    { name: '', type: 'TEXT' },
    { name: '', type: 'TEXT' },
    { name: '', type: 'TEXT' },
  ]);
  const [scratchRowData, setScratchRowData] = useState({});
  const [createScratchLoading, setCreateScratchLoading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncComment, setSyncComment] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingColumn, setEditingColumn] = useState(null);
  const [editColumnData, setEditColumnData] = useState({ newColumnName: '' });
  const [confirmUpdateColumn, setConfirmUpdateColumn] = useState(null);
  const [updateColumnLoading, setUpdateColumnLoading] = useState(null);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/getAllSchemas');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schemas');
      }
      
      setSchemas(data.schemas || []);
      setTotalSchemas(data.totalSchemas || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSchema = async () => {
    if (!schemaName.trim()) {
      setError('Schema name is required');
      return;
    }
    
    setCreateLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/createSchema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schemaName: schemaName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create schema');
      }
      
      setSchemaName('');
      await fetchSchemas();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteSchema = async (schemaToDelete) => {
    setDeleteLoading(schemaToDelete);
    setError(null);
    
    try {
      const response = await fetch('/api/deleteSchema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schemaName: schemaToDelete }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete schema');
      }
      
      setConfirmDeleteSchema(null);
      await fetchSchemas();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const viewTables = async (schemaToView) => {
    setTablesLoading(schemaToView);
    setError(null);
    
    try {
      const response = await fetch(`/api/getTables?schema=${encodeURIComponent(schemaToView)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tables');
      }
      
      setTables(data.tables || []);
      setSelectedSchema(schemaToView);
    } catch (err) {
      setError(err.message);
    } finally {
      setTablesLoading(null);
    }
  };

  const createTable = async (schemaName) => {
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }
    
    setShowScratchPopup({ schemaName, tableName: tableName.trim() });
    setShowAddTable(null);
    
    setScratchColumns([
      { name: '', type: 'TEXT' },
      { name: '', type: 'TEXT' },
      { name: '', type: 'TEXT' }
    ]);
    setScratchRowData({});
  };

  const createTableFromScratch = async () => {
    if (!showScratchPopup) return;
    
    const { schemaName, tableName } = showScratchPopup;
    
    const validColumns = scratchColumns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      setError('At least one column name is required');
      return;
    }
    
    setCreateScratchLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/createTableScratch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaName,
          tableName,
          columns: validColumns,
          rowData: scratchRowData
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create table');
      }
      
      setTableName('');
      setShowScratchPopup(null);
      setScratchColumns([
        { name: '', type: 'TEXT' },
        { name: '', type: 'TEXT' },
        { name: '', type: 'TEXT' }
      ]);
      setScratchRowData({});
      
      if (selectedSchema === schemaName) {
        await viewTables(schemaName);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateScratchLoading(false);
    }
  };

  const deleteTable = async (schemaName, tableToDelete) => {
    setDeleteTableLoading(`${schemaName}.${tableToDelete}`);
    setError(null);
    
    try {
      const response = await fetch('/api/deleteTable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schemaName: schemaName, 
          tableName: tableToDelete 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete table');
      }
      
      setConfirmDelete(null);
      
      await viewTables(schemaName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteTableLoading(null);
    }
  };

  const viewTableData = async (schemaName, tableToView) => {
    setTableDataLoading(`${schemaName}.${tableToView}`);
    setError(null);
    
    try {
      const response = await fetch(`/api/getTableData?schema=${encodeURIComponent(schemaName)}&table=${encodeURIComponent(tableToView)}&limit=100`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch table data');
      }
      
      setTableData(data.rows || []);
      setViewingTable({ schema: schemaName, table: tableToView });
    } catch (err) {
      setError(err.message);
    } finally {
      setTableDataLoading(null);
    }
  };

  const deleteRow = async (schema, table, id) => {
    setDeleteRowLoading(id);
    setError(null);
    
    try {
      const response = await fetch('/api/insideTableDelete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema, table, id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete row');
      }
      
      setConfirmDeleteRow(null);
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteRowLoading(null);
    }
  };

  const openEditModal = (row) => {
    const rowId = row.id || row.ID || Object.values(row)[0];
    setEditingRow({ 
      schema: viewingTable.schema, 
      table: viewingTable.table, 
      id: rowId,
      originalData: row
    });
    setEditFormData({ ...row });
  };

  const updateRow = async (schema, table, id, row) => {
    setUpdateRowLoading(id);
    setError(null);
    
    try {
      const idColumn = tableData.length > 0 && Object.keys(tableData[0]).find(key => 
        key.toLowerCase() === 'id' || key.toLowerCase().endsWith('_id')
      ) || 'id';
      
      const response = await fetch('/api/updateTableRow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schemaName: schema, 
          tableName: table, 
          idColumn: idColumn,
          idValue: id,
          updates: row 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update row');
      }
      
      setConfirmUpdateRow(null);
      setEditingRow(null);
      setEditFormData({});
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateRowLoading(null);
    }
  };

  const openAddModal = async () => {
    try {
      const response = await fetch(`/api/getTableData?schema=${encodeURIComponent(viewingTable.schema)}&table=${encodeURIComponent(viewingTable.table)}&limit=1`);
      const data = await response.json();
      
      if (response.ok && data.rows && data.rows.length > 0) {
        const columns = Object.keys(data.rows[0]).filter(column => 
          column.toLowerCase() !== 'created_at'
        );
        const emptyFormData = columns.reduce((acc, column) => {
          acc[column] = '';
          return acc;
        }, {});
        setAddFormData(emptyFormData);
      } else if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]).filter(column => 
          column.toLowerCase() !== 'created_at'
        );
        const emptyFormData = columns.reduce((acc, column) => {
          acc[column] = '';
          return acc;
        }, {});
        setAddFormData(emptyFormData);
      } else {
        setAddFormData({ id: '', value: '' });
      }
      
      setAddingRow({ 
        schema: viewingTable.schema, 
        table: viewingTable.table
      });
    } catch (err) {
      setError('Failed to prepare add form');
    }
  };

  const insertRow = async (schema, table, rowData) => {
    setAddRowLoading(true);
    setError(null);
    
    try {
      const payload = { 
        schemaName: schema, 
        tableName: table, 
        rowData: rowData
      };
      console.log('Sending to insertTableRow API:', payload);
      
      const response = await fetch('/api/insertTableRow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to insert row');
      }
      
      setConfirmAddRow(null);
      setAddingRow(null);
      setAddFormData({});
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddRowLoading(null);
    }
  };

  const columnTypes = [
    'text', 'varchar', 'char', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 
    'real', 'double precision', 'boolean', 'date', 'timestamp', 'timestamptz', 
    'time', 'timetz', 'interval', 'json', 'jsonb', 'uuid', 'bytea'
  ];

  const openAddColumnModal = () => {
    setAddColumnData({
      columnName: '',
      columnType: 'text',
      defaultValue: '',
      isNullable: true
    });
    setAddingColumn({ 
      schema: viewingTable.schema, 
      table: viewingTable.table
    });
  };

  const insertColumn = async (schema, table, columnData) => {
    setAddColumnLoading(true);
    setError(null);
    
    try {
      const payload = { 
        schemaName: schema, 
        tableName: table, 
        columnName: columnData.columnName,
        columnType: columnData.columnType,
        defaultValue: columnData.defaultValue || null,
        isNullable: columnData.isNullable
      };
      console.log('Sending to insertTableColumn API:', payload);
      
      const response = await fetch('/api/insertTableColumn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add column');
      }
      
      setConfirmAddColumn(null);
      setAddingColumn(null);
      setAddColumnData({});
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddColumnLoading(null);
    }
  };

  const deleteColumn = async (schema, table, columnName) => {
    setDeleteColumnLoading(columnName);
    setError(null);
    
    try {
      const response = await fetch('/api/deleteTableColumn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schemaName: schema, 
          tableName: table, 
          columnName: columnName
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete column');
      }
      
      setConfirmDeleteColumn(null);
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteColumnLoading(null);
    }
  };

  const openEditColumnModal = (columnName) => {
    setEditingColumn({ 
      schema: viewingTable.schema, 
      table: viewingTable.table, 
      columnName: columnName
    });
    setEditColumnData({ newColumnName: columnName });
  };

  const updateColumnName = async (schema, table, oldColumnName, newColumnName) => {
    setUpdateColumnLoading(oldColumnName);
    setError(null);
    
    try {
      const response = await fetch('/api/updateColumnName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          schemaName: schema, 
          tableName: table, 
          oldColumnName: oldColumnName,
          newColumnName: newColumnName
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update column name');
      }
      
      setConfirmUpdateColumn(null);
      setEditingColumn(null);
      setEditColumnData({ newColumnName: '' });
      
      await viewTableData(schema, table);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateColumnLoading(null);
    }
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const syncSchema = async () => {
    if (!syncComment.trim()) {
      setError('Comment is required for schema sync');
      return;
    }
    
    setSyncLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/captureSchema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: syncComment.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync schema');
      }
      
      setSyncComment('');
      setShowSyncModal(false);
      showSuccessToast('Sync schema was updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div style={containerStyle(isMobile)}>
      <div style={{ ...cardStyle, maxWidth: '1792px' }}>
        <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', alignItems: isMobile ? 'stretch' : 'center' }}>
            <button
      onClick={() => navigate("/admin/home")} // ✅ replaced router.push
      style={backButtonStyle}
    >
      ← Back to Admin Home
    </button>
            <button
              onClick={() => setShowSyncModal(true)}
              style={{
                ...buttonStyle,
                backgroundColor: '#059669',
                flex: isMobile ? 1 : 'none'
              }}
            >
              Sync Schema
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={cardStyle}>
              <div style={sectionStyle(isMobile)}>
                <h2 style={headingStyle}>Master Database Schemas</h2>

                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={schemaName}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-z_]/g, '');
                        setSchemaName(value);
                      }}
                      placeholder="Enter schema name (lowercase letters and underscores only)"
                      style={inputStyle}
                      onKeyPress={(e) => e.key === 'Enter' && !createLoading && createSchema()}
                      pattern="[a-z_]*"
                    />
                    <button
                      onClick={createSchema}
                      disabled={createLoading || !schemaName.trim()}
                      style={createLoading || !schemaName.trim() ? greenButtonDisabledStyle : greenButtonStyle}
                    >
                      {createLoading ? 'Creating...' : 'Create Schema'}
                    </button>
                  </div>

                  <button
                    onClick={fetchSchemas}
                    disabled={loading}
                    style={loading ? buttonDisabledStyle : buttonStyle}
                  >
                    {loading ? 'Loading...' : 'Get All Schemas'}
                  </button>
                </div>

                {error && (
                  <div style={errorBoxStyle}>
                    <p style={{ fontWeight: '500' }}>Error:</p>
                    <p>{error}</p>
                  </div>
                )}

                {totalSchemas > 0 && (
                  <div style={successBoxStyle}>
                    <p style={{ fontWeight: '500' }}>Found {totalSchemas} schema(s)</p>
                  </div>
                )}

                {schemas.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#374151' }}>
                      Schema List:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {schemas.map((schema, index) => (
                        <div key={index} style={schemaItemStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#1f2937' }}>
                                {schema.schema_name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <button
                                onClick={() => setShowAddTable(showAddTable === schema.schema_name ? null : schema.schema_name)}
                                style={greenButtonStyle}
                              >
                                Add Table
                              </button>
                              <button
                                onClick={() => viewTables(schema.schema_name)}
                                disabled={tablesLoading === schema.schema_name}
                                style={tablesLoading === schema.schema_name ? buttonDisabledStyle : buttonStyle}
                              >
                                {tablesLoading === schema.schema_name ? 'Loading...' : 'View Tables'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteSchema(schema.schema_name)}
                                disabled={deleteLoading === schema.schema_name}
                                style={deleteLoading === schema.schema_name ? redButtonDisabledStyle : redButtonStyle}
                              >
                                {deleteLoading === schema.schema_name ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          {showAddTable === schema.schema_name && (
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #d1d5db' }}>
                              <input
                                type="text"
                                value={tableName}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^a-z_]/g, '');
                                  setTableName(value);
                                }}
                                placeholder="Enter table name (lowercase letters and underscores only)"
                                style={{ ...inputStyle, fontSize: '0.875rem' }}
                                onKeyPress={(e) => e.key === 'Enter' && !createTableLoading && createTable(schema.schema_name)}
                                pattern="[a-z_]*"
                              />
                              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button
                                  onClick={() => createTable(schema.schema_name)}
                                  disabled={createTableLoading === schema.schema_name || !tableName.trim()}
                                  style={createTableLoading === schema.schema_name || !tableName.trim() ? greenButtonDisabledStyle : greenButtonStyle}
                                >
                                  {createTableLoading === schema.schema_name ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAddTable(null);
                                    setTableName('');
                                  }}
                                  style={grayButtonStyle}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSchema && tables.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#374151' }}>
                      Tables in "{selectedSchema}" schema:
                    </h3>
                    <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                      {tables.map((table, index) => (
                        <div key={index} style={tableItemStyle}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#1e40af', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
                            {table.table_name}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <button
                              onClick={() => viewTableData(selectedSchema, table.table_name)}
                              disabled={tableDataLoading === `${selectedSchema}.${table.table_name}`}
                              style={tableDataLoading === `${selectedSchema}.${table.table_name}` ? buttonDisabledStyle : buttonStyle}
                            >
                              {tableDataLoading === `${selectedSchema}.${table.table_name}` ? 'Loading...' : 'View'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ schema: selectedSchema, table: table.table_name })}
                              disabled={deleteTableLoading === `${selectedSchema}.${table.table_name}`}
                              style={deleteTableLoading === `${selectedSchema}.${table.table_name}` ? redButtonDisabledStyle : redButtonStyle}
                            >
                              {deleteTableLoading === `${selectedSchema}.${table.table_name}` ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => {
                          setTables([]);
                          setSelectedSchema(null);
                        }}
                        style={grayButtonStyle}
                      >
                        Clear Tables View
                      </button>
                      <div style={{ fontSize: '0.875rem', color: '#4b5563', padding: '0.5rem 0' }}>
                        Found {tables.length} table(s) in "{selectedSchema}" schema
                      </div>
                    </div>
                  </div>
                )}

                {selectedSchema && tables.length === 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={warningBoxStyle}>
                      <p style={{ fontWeight: '500' }}>No Tables Found</p>
                      <p>The schema "{selectedSchema}" does not contain any tables. Try creating a table using the "Add Table" button above <strong>NOTE: this schema will not be synced in tenant DB because it is empty.</strong></p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setTables([]);
                          setSelectedSchema(null);
                        }}
                        style={grayButtonStyle}
                      >
                        Clear Tables View
                      </button>
                    </div>
                  </div>
                )}

                {confirmDelete && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                          Delete Table Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
                          Are you sure you want to delete the table{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmDelete.schema}.{confirmDelete.table}
                          </span>
                          ? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            disabled={deleteTableLoading}
                            style={deleteTableLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => deleteTable(confirmDelete.schema, confirmDelete.table)}
                            disabled={deleteTableLoading}
                            style={deleteTableLoading ? redButtonDisabledStyle : redButtonStyle}
                          >
                            {deleteTableLoading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmDeleteSchema && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                          Delete Schema Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
                          Are you sure you want to delete the schema{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmDeleteSchema}
                          </span>
                          ? This action cannot be undone and will delete all tables within this schema.
                        </p>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmDeleteSchema(null)}
                            disabled={deleteLoading}
                            style={deleteLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => deleteSchema(confirmDeleteSchema)}
                            disabled={deleteLoading}
                            style={deleteLoading ? redButtonDisabledStyle : redButtonStyle}
                          >
                            {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmDeleteRow && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                          Delete Row Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to delete this row from{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmDeleteRow.schema}.{confirmDeleteRow.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...schemaItemStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                            Row ID: <span style={{ fontFamily: 'monospace' }}>{confirmDeleteRow.id}</span>
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#dc2626' }}>This action cannot be undone.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmDeleteRow(null)}
                            disabled={deleteRowLoading}
                            style={deleteRowLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => deleteRow(confirmDeleteRow.schema, confirmDeleteRow.table, confirmDeleteRow.id)}
                            disabled={deleteRowLoading}
                            style={deleteRowLoading ? redButtonDisabledStyle : redButtonStyle}
                          >
                            {deleteRowLoading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editingRow && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={{ ...modalContentStyle(isMobile), maxWidth: isMobile ? '100%' : '36rem' }}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Edit Row - {editingRow.schema}.{editingRow.table}
                        </h3>
                        <div style={{ maxHeight: '24rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {Object.keys(editFormData).map((key) => (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                {key}
                              </label>
                              <input
                                type="text"
                                value={editFormData[key] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                                style={inputStyle}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingRow(null);
                              setEditFormData({});
                            }}
                            style={grayButtonStyle}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              setConfirmUpdateRow({
                                schema: editingRow.schema,
                                table: editingRow.table,
                                id: editingRow.id,
                                newData: editFormData,
                                originalData: editingRow.originalData,
                              })
                            }
                            style={buttonStyle}
                          >
                            Update Row
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmUpdateRow && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Update Row Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to update this row in{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>
                            {confirmUpdateRow.schema}.{confirmUpdateRow.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...schemaItemStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                            Row ID: <span style={{ fontFamily: 'monospace' }}>{confirmUpdateRow.id}</span>
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#2563eb' }}>Changes will be applied immediately.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmUpdateRow(null)}
                            disabled={updateRowLoading}
                            style={updateRowLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => updateRow(confirmUpdateRow.schema, confirmUpdateRow.table, confirmUpdateRow.id, confirmUpdateRow.newData)}
                            disabled={updateRowLoading}
                            style={updateRowLoading ? buttonDisabledStyle : buttonStyle}
                          >
                            {updateRowLoading ? 'Updating...' : 'Yes, Update'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {addingRow && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={{ ...modalContentStyle(isMobile), maxWidth: isMobile ? '100%' : '36rem' }}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a', marginBottom: '1rem' }}>
                          Add New Row - {addingRow.schema}.{addingRow.table}
                        </h3>
                        <div style={{ maxHeight: '24rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {Object.keys(addFormData).map((key) => (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                {key}
                              </label>
                              <input
                                type="text"
                                value={addFormData[key] || ''}
                                onChange={(e) => setAddFormData({ ...addFormData, [key]: e.target.value })}
                                style={inputStyle}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                          <button
                            onClick={() => {
                              setAddingRow(null);
                              setAddFormData({});
                            }}
                            style={grayButtonStyle}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setConfirmAddRow({ schema: addingRow.schema, table: addingRow.table, newData: addFormData })}
                            style={greenButtonStyle}
                          >
                            Add Row
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmAddRow && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a', marginBottom: '1rem' }}>
                          Add Row Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to add this new row to{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#16a34a' }}>
                            {confirmAddRow.schema}.{confirmAddRow.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...schemaItemStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>A new row will be created with the provided data.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmAddRow(null)}
                            disabled={addRowLoading}
                            style={addRowLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => insertRow(confirmAddRow.schema, confirmAddRow.table, confirmAddRow.newData)}
                            disabled={addRowLoading}
                            style={addRowLoading ? greenButtonDisabledStyle : greenButtonStyle}
                          >
                            {addRowLoading ? 'Adding...' : 'Yes, Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {addingColumn && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={{ ...modalContentStyle(isMobile), maxWidth: isMobile ? '100%' : '36rem' }}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Add New Column - {addingColumn.schema}.{addingColumn.table}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              Column Name
                            </label>
                            <input
                              type="text"
                              value={addColumnData.columnName || ''}
                              onChange={(e) => setAddColumnData({ ...addColumnData, columnName: e.target.value })}
                              style={inputStyle}
                              placeholder="Enter column name"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              Column Type
                            </label>
                            <select
                              value={addColumnData.columnType || 'text'}
                              onChange={(e) => setAddColumnData({ ...addColumnData, columnType: e.target.value })}
                              style={inputStyle}
                            >
                              {columnTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              Default Value (optional)
                            </label>
                            <input
                              type="text"
                              value={addColumnData.defaultValue || ''}
                              onChange={(e) => {
                                setAddColumnData({
                                  ...addColumnData,
                                  defaultValue: e.target.value,
                                  isNullable: e.target.value.trim() === '' ? true : addColumnData.isNullable,
                                });
                              }}
                              style={inputStyle}
                              placeholder="Enter default value"
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              Allow NULL values
                            </label>
                            <select
                              value={addColumnData.isNullable}
                              onChange={(e) => setAddColumnData({ ...addColumnData, isNullable: e.target.value === 'true' })}
                              style={inputStyle}
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          </div>
                          {addColumnData.defaultValue?.trim() === '' && addColumnData.isNullable === false && (
                            <div style={warningBoxStyle}>
                              <p style={{ fontWeight: '500' }}>Warning:</p>
                              <p>Setting isNullable to false without a default value may cause issues. Consider providing a default value.</p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                          <button
                            onClick={() => {
                              setAddingColumn(null);
                              setAddColumnData({});
                            }}
                            style={grayButtonStyle}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setConfirmAddColumn({ schema: addingColumn.schema, table: addingColumn.table, columnData: addColumnData })}
                            disabled={!addColumnData.columnName?.trim()}
                            style={!addColumnData.columnName?.trim() ? buttonDisabledStyle : buttonStyle}
                          >
                            Add Column
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmAddColumn && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Add Column Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to add this new column to{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>
                            {confirmAddColumn.schema}.{confirmAddColumn.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...schemaItemStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '500' }}>Column:</span> {confirmAddColumn.columnData.columnName}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '500' }}>Type:</span> {confirmAddColumn.columnData.columnType}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '500' }}>Default:</span> {confirmAddColumn.columnData.defaultValue || 'None'}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            <span style={{ fontWeight: '500' }}>Nullable:</span> {confirmAddColumn.columnData.isNullable ? 'Yes' : 'No'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.5rem' }}>
                            Column will be added to the table structure.
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmAddColumn(null)}
                            disabled={addColumnLoading}
                            style={addColumnLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => insertColumn(confirmAddColumn.schema, confirmAddColumn.table, confirmAddColumn.columnData)}
                            disabled={addColumnLoading}
                            style={addColumnLoading ? buttonDisabledStyle : buttonStyle}
                          >
                            {addColumnLoading ? 'Adding...' : 'Yes, Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmDeleteColumn && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                          Delete Column Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to permanently delete column{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmDeleteColumn.columnName}
                          </span>{' '}
                          from table{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmDeleteColumn.schema}.{confirmDeleteColumn.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...errorBoxStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontWeight: '500' }}>⚠️ Warning:</p>
                          <p>All data in this column will be permanently deleted.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmDeleteColumn(null)}
                            disabled={deleteColumnLoading}
                            style={deleteColumnLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => deleteColumn(confirmDeleteColumn.schema, confirmDeleteColumn.table, confirmDeleteColumn.columnName)}
                            disabled={deleteColumnLoading}
                            style={deleteColumnLoading ? redButtonDisabledStyle : redButtonStyle}
                          >
                            {deleteColumnLoading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editingColumn && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={{ ...modalContentStyle(isMobile), maxWidth: isMobile ? '100%' : '28rem' }}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Edit Column Name - {editingColumn.schema}.{editingColumn.table}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              Current Column Name
                            </label>
                            <input
                              type="text"
                              value={editingColumn.columnName}
                              disabled
                              style={{
                                ...inputStyle,
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                              New Column Name
                            </label>
                            <input
                              type="text"
                              value={editColumnData.newColumnName || ''}
                              onChange={(e) => setEditColumnData({ ...editColumnData, newColumnName: e.target.value })}
                              style={inputStyle}
                              placeholder="Enter new column name"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingColumn(null);
                              setEditColumnData({ newColumnName: '' });
                            }}
                            style={grayButtonStyle}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              setConfirmUpdateColumn({
                                schema: editingColumn.schema,
                                table: editingColumn.table,
                                oldColumnName: editingColumn.columnName,
                                newColumnName: editColumnData.newColumnName.trim(),
                              })
                            }
                            disabled={!editColumnData.newColumnName?.trim() || editColumnData.newColumnName.trim() === editingColumn.columnName}
                            style={!editColumnData.newColumnName?.trim() || editColumnData.newColumnName.trim() === editingColumn.columnName ? buttonDisabledStyle : buttonStyle}
                          >
                            Update Column
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {confirmUpdateColumn && (
                  <div style={modalOverlayStyle(isMobile)}>
                    <div style={modalContentStyle(isMobile)}>
                      <div style={sectionStyle(isMobile)}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                          Update Column Name Confirmation
                        </h3>
                        <p style={{ color: '#374151', marginBottom: '1rem' }}>
                          Are you sure you want to rename column{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                            {confirmUpdateColumn.oldColumnName}
                          </span>{' '}
                          to{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>
                            {confirmUpdateColumn.newColumnName}
                          </span>{' '}
                          in table{' '}
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>
                            {confirmUpdateColumn.schema}.{confirmUpdateColumn.table}
                          </span>
                          ?
                        </p>
                        <div style={{ ...schemaItemStyle, marginBottom: '1.5rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                            Old Name: <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>{confirmUpdateColumn.oldColumnName}</span>
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                            New Name: <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{confirmUpdateColumn.newColumnName}</span>
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#2563eb' }}>Column will be renamed immediately.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setConfirmUpdateColumn(null)}
                            disabled={updateColumnLoading}
                            style={updateColumnLoading ? grayButtonDisabledStyle : grayButtonStyle}
                          >
                            No, Cancel
                          </button>
                          <button
                            onClick={() => updateColumnName(confirmUpdateColumn.schema, confirmUpdateColumn.table, confirmUpdateColumn.oldColumnName, confirmUpdateColumn.newColumnName)}
                            disabled={updateColumnLoading}
                            style={updateColumnLoading ? buttonDisabledStyle : buttonStyle}
                          >
                            {updateColumnLoading ? 'Updating...' : 'Yes, Update'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && schemas.length === 0 && totalSchemas === 0 && !error && (
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>
                    <p>Click the button above to load database schemas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {viewingTable && (
            <div style={{ flex: 1, maxWidth: isMobile ? '100%' : '672px' }}>
              <div style={cardStyle}>
                <div style={sectionStyle(isMobile)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={headingStyle}>
                      Table Data: {viewingTable.schema}.{viewingTable.table}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={openAddColumnModal} style={buttonStyle}>
                        Add Column
                      </button>
                      <button onClick={openAddModal} style={greenButtonStyle}>
                        Add Row
                      </button>
                      <button
                        onClick={() => {
                          setViewingTable(null);
                          setTableData([]);
                        }}
                        style={grayButtonStyle}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {tableData.length > 0 ? (
                    <div style={{ maxHeight: '24rem', overflow: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ ...tableHeaderStyle, width: '5rem', textAlign: 'center' }}></th>
                            {Object.keys(tableData[0] || {}).map((column, index) => (
                              <th key={index} style={{ ...tableHeaderStyle, textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => openEditColumnModal(column)}
                                    disabled={updateColumnLoading === column}
                                    style={{
                                      ...buttonStyle,
                                      padding: '0.25rem',
                                      fontSize: '0.75rem',
                                      minWidth: '1.5rem',
                                      height: '1.5rem',
                                      ...(updateColumnLoading === column ? buttonDisabledStyle : {})
                                    }}
                                  >
                                    {updateColumnLoading === column ? '...' : '✎'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteColumn({ schema: viewingTable.schema, table: viewingTable.table, columnName: column })}
                                    disabled={deleteColumnLoading === column}
                                    style={{
                                      ...redButtonStyle,
                                      padding: '0.25rem',
                                      fontSize: '0.75rem',
                                      minWidth: '1.5rem',
                                      height: '1.5rem',
                                      ...(deleteColumnLoading === column ? redButtonDisabledStyle : {})
                                    }}
                                  >
                                    {deleteColumnLoading === column ? '...' : '×'}
                                  </button>
                                </div>
                              </th>
                            ))}
                          </tr>
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ ...tableHeaderStyle, width: '5rem' }}>Actions</th>
                            {Object.keys(tableData[0] || {}).map((column, index) => (
                              <th key={index} style={tableHeaderStyle}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, index) => {
                            const rowId = row.id || row.ID || Object.values(row)[0];
                            return (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                <td style={{ ...tableCellStyle, padding: '0.25rem 0.75rem' }}>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                      onClick={() => openEditModal(row)}
                                      disabled={updateRowLoading === rowId}
                                      style={updateRowLoading === rowId ? buttonDisabledStyle : buttonStyle}
                                    >
                                      {updateRowLoading === rowId ? '...' : '✎'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteRow({ schema: viewingTable.schema, table: viewingTable.table, id: rowId, rowData: row })}
                                      disabled={deleteRowLoading === rowId}
                                      style={deleteRowLoading === rowId ? redButtonDisabledStyle : redButtonStyle}
                                    >
                                      {deleteRowLoading === rowId ? '...' : '×'}
                                    </button>
                                  </div>
                                </td>
                                {Object.values(row).map((value, colIndex) => (
                                  <td key={colIndex} style={tableCellStyle}>
                                    {value !== null && value !== undefined ? String(value) : '—'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>
                      <p>No data found in this table</p>
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                    Showing {tableData.length} row(s) (limited to 100)
                  </div>
                </div>
              </div>
            </div>
          )}

          {showScratchPopup && (
            <div style={modalOverlayStyle(isMobile)}>
              <div style={{ ...modalContentStyle(isMobile), maxWidth: isMobile ? '100%' : '896px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={sectionStyle(isMobile)}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                    Create Table "{showScratchPopup.tableName}" from Scratch
                  </h3>
                  <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
                    Configure 3 columns and add initial row data for your new table.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                        Column Configuration
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {scratchColumns.map((column, index) => (
                          <div key={index} style={{ ...schemaItemStyle, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                Column {index + 1} Name
                              </label>
                              <input
                                type="text"
                                value={column.name}
                                onChange={(e) => {
                                  const newColumns = [...scratchColumns];
                                  newColumns[index].name = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                  setScratchColumns(newColumns);
                                }}
                                placeholder="column_name"
                                style={inputStyle}
                              />
                            </div>
                            <div style={{ width: isMobile ? '100%' : '8rem' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                Type
                              </label>
                              <select
                                value={column.type}
                                onChange={(e) => {
                                  const newColumns = [...scratchColumns];
                                  newColumns[index].type = e.target.value;
                                  setScratchColumns(newColumns);
                                }}
                                style={inputStyle}
                              >
                                <option value="TEXT">TEXT</option>
                                <option value="INTEGER">INTEGER</option>
                                <option value="REAL">REAL</option>
                                <option value="BOOLEAN">BOOLEAN</option>
                                <option value="DATE">DATE</option>
                                <option value="TIMESTAMP">TIMESTAMP</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                        Initial Row Data (Optional)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {scratchColumns.map((column, index) => {
                          if (!column.name.trim()) return null;
                          return (
                            <div key={index} style={{ ...schemaItemStyle, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
                              <div style={{ width: isMobile ? '100%' : '10rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                  {column.name}
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({column.type})</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="text"
                                  value={scratchRowData[column.name] || ''}
                                  onChange={(e) => {
                                    setScratchRowData((prev) => ({ ...prev, [column.name]: e.target.value }));
                                  }}
                                  placeholder={`Enter ${column.name} value`}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => {
                        setShowScratchPopup(null);
                        setScratchColumns([
                          { name: '', type: 'TEXT' },
                          { name: '', type: 'TEXT' },
                          { name: '', type: 'TEXT' },
                        ]);
                        setScratchRowData({});
                        setTableName('');
                      }}
                      disabled={createScratchLoading}
                      style={createScratchLoading ? grayButtonDisabledStyle : grayButtonStyle}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createTableFromScratch}
                      disabled={createScratchLoading || scratchColumns.filter((col) => col.name.trim()).length === 0}
                      style={createScratchLoading || scratchColumns.filter((col) => col.name.trim()).length === 0 ? buttonDisabledStyle : buttonStyle}
                    >
                      {createScratchLoading ? 'Creating Table...' : 'Create Table'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Schema Modal */}
          {showSyncModal && (
            <div style={modalOverlayStyle(isMobile)}>
              <div style={modalContentStyle(isMobile)}>
                <div style={{ padding: '1.5rem' }}>
                  <h2 style={headingStyle}>Sync Schema</h2>
                  
                  {error && (
                    <div style={errorBoxStyle}>
                      {error}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      Comment (required):
                    </label>
                    <textarea
                      value={syncComment}
                      onChange={(e) => setSyncComment(e.target.value)}
                      placeholder="Enter a comment describing this schema sync..."
                      style={{
                        ...inputStyle,
                        minHeight: '80px',
                        resize: 'vertical',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      disabled={syncLoading}
                    />
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    gap: '0.75rem', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      onClick={() => {
                        setShowSyncModal(false);
                        setSyncComment('');
                        setError(null);
                      }}
                      disabled={syncLoading}
                      style={syncLoading ? grayButtonDisabledStyle : grayButtonStyle}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={syncSchema}
                      disabled={syncLoading || !syncComment.trim()}
                      style={syncLoading || !syncComment.trim() ? buttonDisabledStyle : buttonStyle}
                    >
                      {syncLoading ? 'Syncing...' : 'Add Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {showToast && (
            <div style={toastStyle(isMobile)}>
              <span>✓</span>
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}