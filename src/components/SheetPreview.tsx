import { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import type { Order } from '../types';
import { lineManagers, clients } from '../data/masterData';
import BatchTrackingSheetPDF from './BatchTrackingSheetPDF';

interface SheetPreviewProps {
  order: Order;
  onClose: () => void;
}

const SheetPreview = ({ order, onClose }: SheetPreviewProps) => {
  // Calculate total sheets (sum of all stages across all batches)
  const totalSheets = order.batches.reduce((total, batch) => total + batch.stages.length, 0);

  // Get client name
  const clientName = clients.find((c) => c.id === order.clientId)?.name || order.clientId;

  // Generate all sheets with sequential numbering
  let currentSheetNumber = 0;
  const sheets = order.batches.flatMap((batch) =>
    batch.stages.map((stage, stageIndex) => {
      currentSheetNumber++;
      const lineManagerId = stage.lineManagerId;
      const lineManagerName =
        lineManagers.find((lm) => lm.id === lineManagerId)?.name || 'Unknown';

      return {
        batch,
        stage,
        stageIndex,
        lineManagerName,
        sheetNumber: currentSheetNumber,
      };
    }),
  );

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header - sticky at top */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Batch Tracking Sheets for Order {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content area - scrollable */}
        <div className="p-4">
          {sheets.map(({ batch, stage, lineManagerName, sheetNumber }) => {
            const stageName = stage.customName || stage.stageId;
            return (
              <div
                key={`${batch.id}-${stage.stageId}-${sheetNumber}`}
                className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Sheet {sheetNumber} of {totalSheets}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Batch: {batch.name} | Stage: {stageName} | Manager: {lineManagerName}
                  </p>
                </div>
                <PDFDownloadLink
                  document={
                    <BatchTrackingSheetPDF
                      order={order}
                      batch={batch}
                      stage={stage}
                      lineManagerName={lineManagerName}
                      clientName={clientName}
                      sheetNumber={sheetNumber}
                      totalSheets={totalSheets}
                    />
                  }
                  fileName={`sheet-${order.orderNumber}-${batch.id}-${stageName}.pdf`}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {({ loading }) => (
                    <>
                      <Download className="h-4 w-4" />
                      {loading ? 'Generating PDF...' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SheetPreview;

