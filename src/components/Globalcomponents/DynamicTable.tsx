// src/components/GlobalComponent/DynamicTable.tsx
import React from 'react';
import { IonGrid, IonRow, IonCol, IonItem } from '@ionic/react';
import './../../CSS/DynamicTable.css';

interface DynamicTableProps {
  data: any[];
  title?: string;
  keyField?: string;
  onRowClick?: (rowData: any) => void;
  selectedRow?: any;
}

const DynamicTable: React.FC<DynamicTableProps> = ({
  data,
  title,
  keyField = 'id', // Default field to use as the unique key
  onRowClick,
  selectedRow,
}) => {
  if (!data || data.length === 0) {
    return <IonItem>No data available</IonItem>;
  }

  const columns = Object.keys(data[0]);

  // Function to format cell content
  const formatCellContent = (value: any): string => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }

    return String(value);
  };

  return (
    <div className="dynamic-table">
      {title && <h2>{title}</h2>}

      <IonGrid>
        {/* Header Row */}
        <IonRow className="header-row">
          {columns.map((col) => (
            <IonCol key={`header-${col}`}>
              <strong>{col.replace(/_/g, ' ')}</strong>
            </IonCol>
          ))}
        </IonRow>

        {/* Data Rows */}
        {data.map((item, rowIndex) => {
          const rowKey = item[keyField] || `row-${rowIndex}`; // Fallback if keyField missing
          return (
            <IonRow
              key={rowKey}
              className={`data-row ${
                selectedRow && selectedRow[keyField] === item[keyField] ? 'selected' : ''
              }`}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((col) => (
                <IonCol key={`${rowKey}-${col}`}>
                  {formatCellContent(item[col])}
                </IonCol>
              ))}
            </IonRow>
          );
        })}
      </IonGrid>
    </div>
  );
};

export default DynamicTable;
