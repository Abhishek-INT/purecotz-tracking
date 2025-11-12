import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import type { Order, Batch, OrderStage } from '../types';
import { clients } from '../data/masterData';

interface SheetTemplateProps {
  order: Order;
  batch: Batch;
  stage: OrderStage;
  lineManagerName: string;
  sheetNumber: number;
  totalSheets: number;
}

const SheetTemplate = ({
  order,
  batch,
  stage,
  lineManagerName,
  sheetNumber,
  totalSheets,
}: SheetTemplateProps) => {
  const clientName = clients.find((c) => c.id === order.clientId)?.name || order.clientId;
  const expectedStartDate = stage.expectedStartDate;
  const expectedEndDate = stage.expectedEndDate;
  const stageName = stage.customName || stage.stageId;
  const qrContent = `ORD-${order.orderNumber}-BATCH-${batch.id}-STAGE-${stageName}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 print:p-0 print:max-w-none">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0.5cm;
            }
            body * {
              visibility: hidden;
            }
            .print-sheet, .print-sheet * {
              visibility: visible;
            }
            .print-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              font-size: 9px !important;
              line-height: 1.3 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="print-sheet">
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="no-print mb-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          Print This Sheet
        </button>

        {/* Header Section */}
        <div className="mb-1 border-b-2 border-black pb-1 print-avoid-break">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase text-black">Purecotz Batch Tracking Sheet</h1>
              <p className="mt-0 text-xs text-black">Sheet {sheetNumber} of {totalSheets}</p>
            </div>
            <div className="flex flex-col items-center">
              <QRCodeSVG value={qrContent} size={70} className="border border-black p-1" />
              <p className="mt-0 text-xs text-black">Scan for details</p>
            </div>
          </div>
        </div>

        {/* Order Details Box */}
        <div className="mb-1 border-2 border-black p-1 print-avoid-break">
          <h2 className="mb-0 text-sm font-bold uppercase text-black">Order Details</h2>
          <div className="grid grid-cols-2 gap-1 text-[10px] leading-[1.2]">
            <div>
              <span className="font-semibold text-black">Order Number:</span>{' '}
              <span className="text-black">{order.orderNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Client:</span>{' '}
              <span className="text-black">{clientName}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Batch Number:</span>{' '}
              <span className="text-black">{batch.id}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Batch Name:</span>{' '}
              <span className="text-black">{batch.name}</span>
            </div>
          </div>
        </div>

        {/* Stage Details Box */}
        <div className="mb-1 border-2 border-black p-1 print-avoid-break">
          <h2 className="mb-0 text-sm font-bold uppercase text-black">Stage Details</h2>
          <div className="space-y-0.5 text-[10px] leading-[1.2]">
            <div>
              <span className="font-semibold text-black">Stage Name:</span>{' '}
              <span className="text-black">{stageName}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Line Manager:</span>{' '}
              <span className="text-black">{lineManagerName}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Expected Qty:</span>{' '}
              <span className="text-black">{batch.quantity.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Expected Start Date:</span>{' '}
              <span className="text-black">{expectedStartDate}</span>
            </div>
            <div>
              <span className="font-semibold text-black">Expected End Date:</span>{' '}
              <span className="text-black">{expectedEndDate}</span>
            </div>
          </div>
        </div>

        {/* Progress Tracking Table */}
        <div className="mb-1 print-avoid-break">
          <h2 className="mb-0 text-sm font-bold uppercase text-black">Progress Tracking</h2>
          <table className="w-full border-collapse border-2 border-black text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">DATE</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">TIME</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">ACTION</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">QUANTITY DONE</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">DEFECTS</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">INITIALS</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">REMAINING</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">
                    <div className="flex flex-col gap-0.5">
                      <label className="flex items-center gap-0.5">
                        <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                        <span className="text-[9px]">START</span>
                      </label>
                      <label className="flex items-center gap-0.5">
                        <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                        <span className="text-[9px]">PROGRESS</span>
                      </label>
                      <label className="flex items-center gap-0.5">
                        <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                        <span className="text-[9px]">COMPLETE</span>
                      </label>
                    </div>
                  </td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">
                    {index === 0 ? batch.quantity.toLocaleString() : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Defects Tracking Table */}
        <div className="mb-1 print-avoid-break">
          <h2 className="mb-0 text-sm font-bold uppercase text-black">Defects Tracking</h2>
          <table className="w-full border-collapse border-2 border-black text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">DATE</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">TIME</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">QTY</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">SOURCE STAGE</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">DEFECT TYPE</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">ACTION</th>
                <th className="border border-black px-1 py-0.5 text-left font-bold text-black text-[9px]">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, index) => (
                <tr key={index}>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">{'\u00A0'}</td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">
                    <div className="flex gap-1">
                      <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                      <span className="text-[9px]">Rework</span>
                      <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                      <span className="text-[9px]">Scrap</span>
                    </div>
                  </td>
                  <td className="border border-black px-1 py-1 text-[9px] text-black">
                    <div className="flex gap-1">
                      <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                      <span className="text-[9px]">Fixable</span>
                      <span className="h-2.5 w-2.5 border-2 border-black bg-white inline-block">&nbsp;</span>
                      <span className="text-[9px]">Not Fixable</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-0.5 text-[10px] text-slate-600">
            Note: Record all defects found during this stage. Source Stage indicates where the defect originated.
          </p>
        </div>

        {/* Stage Completion Section */}
        <div className="mb-1 border-2 border-black p-1 print-avoid-break">
          <h2 className="mb-0 text-sm font-bold uppercase text-black">Stage Completion</h2>
          <div className="grid grid-cols-6 gap-1 text-sm">
            <div className="col-span-2">
              <span className="font-semibold text-black text-xs">Total Completed:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-black text-xs">Total Defects:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-black text-xs">Grand Total:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
          </div>
          <div className="mt-1 space-y-0.5 text-sm text-black">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 border-2 border-black bg-white">&nbsp;</span>
              <span>Stage Complete - Ready for Next Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 border-2 border-black bg-white">&nbsp;</span>
              <span>Stage Complete - Defects Override (Operations Manager Only)</span>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 text-sm">
            <div>
              <span className="font-semibold text-black text-xs">Next Stage Manager:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
            <div>
              <span className="font-semibold text-black text-xs">Date:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
            <div>
              <span className="font-semibold text-black text-xs">Time:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
            <div className="col-span-3">
              <span className="font-semibold text-black text-xs">Initials:</span>
              <div className="mt-1 h-5 border-2 border-black bg-white">&nbsp;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetTemplate;

