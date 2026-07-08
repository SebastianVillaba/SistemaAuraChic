import PDFDocument from 'pdfkit-table';
import { Response } from 'express';

const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 0 };

/**
 * Genera PDF para el reporte de venta de productos en un rango de fechas.
 */
export const generateVentasProductoPdf = (res: Response, data: any[], desde: string, hasta: string) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-disposition', `attachment; filename="Reporte_Ventas_Productos_${desde}_al_${hasta}.pdf"`);
  res.setHeader('Content-type', 'application/pdf');
  
  doc.pipe(res);

  // Título del Reporte
  doc.font('Helvetica-Bold').fontSize(18).text(`Reporte de Productos Vendidos`, { align: 'center' });
  doc.fontSize(10).text(`Desde: ${desde}   Hasta: ${hasta}`, { align: 'center' });
  doc.moveDown(2);

  // Calcular los totales generales
  const totalMonto = data.reduce((sum, item) => sum + Number(item.totalMontoVendido || 0), 0);
  const totalCantidad = data.reduce((sum, item) => sum + Number(item.TotalVendido || 0), 0);

  const mappedData = data.map(item => ({
    nombre: item.nombre,
    TotalVendido: Number(item.TotalVendido).toFixed(2),
    totalMontoVendido: Number(item.totalMontoVendido || 0).toLocaleString('es-PY', formatOptions)
  }));

  // Agregar la fila de totales
  mappedData.push({
    nombre: 'TOTAL GENERAL',
    TotalVendido: totalCantidad.toFixed(2),
    totalMontoVendido: totalMonto.toLocaleString('es-PY', formatOptions)
  });

  const tableData = {
    headers: [
      { label: "Nombre del Producto", property: 'nombre', width: 270 },
      { label: "Total Vendido", property: 'TotalVendido', width: 100, align: 'right' as const },
      { label: "Monto Vendido (₲)", property: 'totalMontoVendido', width: 140, align: 'right' as const }
    ],
    datas: mappedData
  };

  doc.table(tableData, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
    prepareRow: (row, iColumn, iRow, rectRow, rectCell) => {
      if (row.nombre === 'TOTAL GENERAL') {
        doc.font("Helvetica-Bold").fontSize(10);
      } else {
        doc.font("Helvetica").fontSize(10);
      }
      return doc;
    }
  });

  doc.end();
};

/**
 * Genera PDF para el reporte de Ventas Resumidas por rango de fechas y sucursal.
 */
export const generateVentasResumidoPdf = (res: Response, data: any[], desde: string, hasta: string, sucursalNombre: string) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-disposition', `attachment; filename="Reporte_Ventas_Resumido_${desde}_al_${hasta}.pdf"`);
  res.setHeader('Content-type', 'application/pdf');
  
  doc.pipe(res);

  // Título del Reporte
  doc.font('Helvetica-Bold').fontSize(18).text(`Reporte de Ventas Resumido`, { align: 'center' });
  doc.fontSize(10).text(`Desde: ${desde}   Hasta: ${hasta}`, { align: 'center' });
  doc.fontSize(10).text(`Sucursal: ${sucursalNombre}`, { align: 'center' });
  doc.moveDown(2);

  // Calcular los totales generales
  let totalVentaSum = 0;
  let totalDescuentoSum = 0;
  let totalNetoSum = 0;

  const mappedData = data.map(item => {
    const tVenta = Number(item.totalVenta || 0);
    const tDesc = Number(item.totalDescuento || 0);
    const tNeto = tVenta - tDesc;

    totalVentaSum += tVenta;
    totalDescuentoSum += tDesc;
    totalNetoSum += tNeto;

    return {
      factura: item.factura || '',
      cliente: item.cliente || '',
      vendedor: item.nombre || '',
      totalVenta: tVenta.toLocaleString('es-PY', formatOptions),
      totalDescuento: tDesc.toLocaleString('es-PY', formatOptions),
      neto: tNeto.toLocaleString('es-PY', formatOptions)
    };
  });

  // Agregar la fila de totales
  mappedData.push({
    factura: 'TOTAL GENERAL',
    cliente: '',
    vendedor: '',
    totalVenta: totalVentaSum.toLocaleString('es-PY', formatOptions),
    totalDescuento: totalDescuentoSum.toLocaleString('es-PY', formatOptions),
    neto: totalNetoSum.toLocaleString('es-PY', formatOptions)
  });

  const tableData = {
    headers: [
      { label: "Nro. Factura / CVE", property: 'factura', width: 100 },
      { label: "Cliente", property: 'cliente', width: 110 },
      { label: "Vendedor", property: 'vendedor', width: 100 },
      { label: "Total Venta (₲)", property: 'totalVenta', width: 70, align: 'right' as const },
      { label: "Desc. (₲)", property: 'totalDescuento', width: 60, align: 'right' as const },
      { label: "Neto (₲)", property: 'neto', width: 70, align: 'right' as const }
    ],
    datas: mappedData
  };

  doc.table(tableData, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: (row, iColumn, iRow, rectRow, rectCell) => {
      if (row.factura === 'TOTAL GENERAL') {
        doc.font("Helvetica-Bold").fontSize(8);
      } else {
        doc.font("Helvetica").fontSize(8);
      }
      return doc;
    }
  });

  doc.end();
};

/**
 * Genera PDF para el reporte de Ventas por Vendedor en un rango de fechas.
 */
export const generateVentasVendedorPdf = (res: Response, data: any[], desde: string, hasta: string) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-disposition', `attachment; filename="Reporte_Ventas_Vendedor_${desde}_al_${hasta}.pdf"`);
  res.setHeader('Content-type', 'application/pdf');
  
  doc.pipe(res);

  // Título del Reporte
  doc.font('Helvetica-Bold').fontSize(18).text(`Reporte de Ventas por Vendedor`, { align: 'center' });
  doc.fontSize(10).text(`Desde: ${desde}   Hasta: ${hasta}`, { align: 'center' });
  doc.moveDown(2);

  // Calcular los totales generales
  const totalGeneral = data.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const mappedData = data.map(item => ({
    nombre: item.nombre || 'SIN DEFINIR',
    total: Number(item.total || 0).toLocaleString('es-PY', formatOptions)
  }));

  // Agregar la fila de totales
  mappedData.push({
    nombre: 'TOTAL GENERAL',
    total: totalGeneral.toLocaleString('es-PY', formatOptions)
  });

  const tableData = {
    headers: [
      { label: "Vendedor", property: 'nombre', width: 310 },
      { label: "Total Neto Vendido (₲)", property: 'total', width: 200, align: 'right' as const }
    ],
    datas: mappedData
  };

  doc.table(tableData, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
    prepareRow: (row, iColumn, iRow, rectRow, rectCell) => {
      if (row.nombre === 'TOTAL GENERAL') {
        doc.font("Helvetica-Bold").fontSize(10);
      } else {
        doc.font("Helvetica").fontSize(10);
      }
      return doc;
    }
  });

  doc.end();
};

