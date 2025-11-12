import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Order, Batch, OrderStage } from '../types';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
    paddingBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#000000',
    padding: 5,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  table: {
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
    borderTopWidth: 2,
    borderTopStyle: 'solid',
    borderTopColor: '#000000',
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: '#000000',
    borderRightWidth: 2,
    borderRightStyle: 'solid',
    borderRightColor: '#000000',
    backgroundColor: '#e5e7eb',
    paddingVertical: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: '#000000',
    borderRightWidth: 2,
    borderRightStyle: 'solid',
    borderRightColor: '#000000',
    minHeight: 25,
  },
  tableCell: {
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#000000',
    padding: 2,
    fontSize: 8,
  },
});

interface BatchTrackingSheetPDFProps {
  order: Order;
  batch: Batch;
  stage: OrderStage;
  lineManagerName: string;
  clientName: string;
  sheetNumber: number;
  totalSheets: number;
}

const BatchTrackingSheetPDF: React.FC<BatchTrackingSheetPDFProps> = ({
  order,
  batch,
  stage,
  lineManagerName,
  clientName,
  sheetNumber,
  totalSheets,
}) => {
  const stageName = stage.customName || stage.stageId;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PURECOTZ BATCH TRACKING SHEET</Text>
            <Text style={{ fontSize: 8 }}>Sheet {sheetNumber} of {totalSheets}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number:</Text>
            <Text>{order.orderNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Batch Number:</Text>
            <Text>{batch.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Batch Name:</Text>
            <Text>{batch.name}</Text>
          </View>
        </View>

        {/* Stage Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STAGE DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Stage Name:</Text>
            <Text>{stageName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Line Manager:</Text>
            <Text>{lineManagerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expected Qty:</Text>
            <Text>{batch.quantity.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expected Start Date:</Text>
            <Text>{stage.expectedStartDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expected End Date:</Text>
            <Text>{stage.expectedEndDate}</Text>
          </View>
        </View>

        {/* Progress Tracking Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>PROGRESS TRACKING</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: '12%' }]}>DATE</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>TIME</Text>
            <Text style={[styles.tableCell, { width: '18%' }]}>ACTION</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>QTY DONE</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>DEFECTS</Text>
            <Text style={[styles.tableCell, { width: '13%' }]}>INITIALS</Text>
            <Text style={[styles.tableCell, { width: '20%', borderRightWidth: 0 }]}>REMAINING</Text>
          </View>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '12%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{' '}</Text>
              <View style={[styles.tableCell, { width: '18%' }]}>
                <Text style={{ fontSize: 7 }}>[ ] START</Text>
                <Text style={{ fontSize: 7 }}>[ ] PROGRESS</Text>
                <Text style={{ fontSize: 7 }}>[ ] COMPLETE</Text>
              </View>
              <Text style={[styles.tableCell, { width: '15%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '20%', borderRightWidth: 0 }]}>
                {i === 0 ? batch.quantity.toLocaleString() : ' '}
              </Text>
            </View>
          ))}
        </View>

        {/* Defects Tracking Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>DEFECTS TRACKING</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: '10%' }]}>DATE</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>TIME</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>QTY</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>SOURCE</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>TYPE</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>ACTION</Text>
            <Text style={[styles.tableCell, { width: '20%', borderRightWidth: 0 }]}>STATUS</Text>
          </View>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{' '}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{' '}</Text>
              <View style={[styles.tableCell, { width: '20%' }]}>
                <Text style={{ fontSize: 7 }}>[ ] Rework [ ] Scrap</Text>
              </View>
              <View style={[styles.tableCell, { width: '20%', borderRightWidth: 0 }]}>
                <Text style={{ fontSize: 7 }}>[ ] Fixable [ ] Not Fixable</Text>
              </View>
            </View>
          ))}
          <Text style={{ fontSize: 8, marginTop: 2 }}>
            Note: Record all defects found during this stage.
          </Text>
        </View>

        {/* Stage Completion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STAGE COMPLETION</Text>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <View style={{ width: '33%', marginRight: 5 }}>
              <Text style={styles.label}>Total Completed:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
            <View style={{ width: '33%', marginRight: 5 }}>
              <Text style={styles.label}>Total Defects:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
            <View style={{ width: '33%' }}>
              <Text style={styles.label}>Grand Total:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
          </View>
          <Text style={{ fontSize: 8, marginBottom: 2 }}>[ ] Stage Complete - Ready for Next Stage</Text>
          <Text style={{ fontSize: 8, marginBottom: 5 }}>[ ] Stage Complete - Defects Override</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '40%', marginRight: 5 }}>
              <Text style={styles.label}>Next Stage Manager:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
            <View style={{ width: '30%', marginRight: 5 }}>
              <Text style={styles.label}>Date:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
            <View style={{ width: '30%' }}>
              <Text style={styles.label}>Time:</Text>
              <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
            </View>
          </View>
          <View style={{ marginTop: 5 }}>
            <Text style={styles.label}>Initials:</Text>
            <View style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#000000', height: 15, marginTop: 2 }} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BatchTrackingSheetPDF;

