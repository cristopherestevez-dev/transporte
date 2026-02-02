"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { HiSearch, HiX, HiUpload, HiDocumentDownload, HiDocument, HiCash, HiCreditCard } from "react-icons/hi";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import jsPDF from "jspdf";

export default function FacturacionTable({ data = [], setData, title, tipo = "cobranzas" }) {
  const [filters, setFilters] = useState({
    razon_social: "",
    cuit: "",
    fecha: "",
    estado: "",
    monto: "",
    tipo_comprobante: "",
    numero_comprobante: "",
  });
  const fileInputRef = useRef(null);
  const [uploadingItemId, setUploadingItemId] = useState(null);

  // Modal de método de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState(null);
  const [metodosPago, setMetodosPago] = useState({
    efectivo: { enabled: false, monto: "" },
    transferencia: { enabled: false, monto: "" },
    cheque: { enabled: false, monto: "" }
  });
  const [cheques, setCheques] = useState([{ numero: "", monto: "" }]);

  // Modal de confirmación para estado final
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  const estadoOptions = [
    { value: "", label: "Todos", color: "text-foreground" },
    { value: "cobrado", label: "Cobrado", color: "text-green-500" },
    { value: "pagado", label: "Pagado", color: "text-green-500" },
    { value: "pago_parcial", label: "Pago Parcial", color: "text-orange-500" },
    { value: "pendiente", label: "Pendiente", color: "text-yellow-500" },
    { value: "vencido", label: "Vencido", color: "text-red-500" },
  ];

  const tipoComprobanteOptions = [
    { value: "", label: "Todos" },
    { value: "factura_a", label: "Factura A" },
    { value: "factura_b", label: "Factura B" },
    { value: "factura_c", label: "Factura C" },
    { value: "nota_credito", label: "Nota de Crédito" },
    { value: "nota_debito", label: "Nota de Débito" },
    { value: "recibo", label: "Recibo" },
  ];

  const getTipoComprobanteLabel = (tipoComp) => {
    const opt = tipoComprobanteOptions.find((o) => o.value === tipoComp);
    return opt ? opt.label : tipoComp || "-";
  };

  const getEstadoColor = (estado) => {
    const opt = estadoOptions.find((o) => o.value === estado);
    return opt ? opt.color : "text-foreground";
  };

  const getEstadoLabel = (estado) => {
    const opt = estadoOptions.find((o) => o.value === estado);
    return opt ? opt.label : estado;
  };

  // Filtrar datos
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchRazon = item.razon_social
        .toLowerCase()
        .includes(filters.razon_social.toLowerCase());
      const matchCuit = item.cuit
        .toLowerCase()
        .includes(filters.cuit.toLowerCase());
      const matchFecha = filters.fecha
        ? item.fecha.includes(filters.fecha)
        : true;
      const matchEstado = filters.estado
        ? item.estado === filters.estado
        : true;
      const matchMonto = filters.monto
        ? item.monto >= parseFloat(filters.monto)
        : true;
      const matchTipoComprobante = filters.tipo_comprobante
        ? item.tipo_comprobante === filters.tipo_comprobante
        : true;
      const matchNumeroComprobante = filters.numero_comprobante
        ? (item.numero_comprobante || "").toLowerCase().includes(filters.numero_comprobante.toLowerCase())
        : true;

      return matchRazon && matchCuit && matchFecha && matchEstado && matchMonto && matchTipoComprobante && matchNumeroComprobante;
    });
  }, [data, filters]);

  // Calcular total
  const total = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + item.monto, 0);
  }, [filteredData]);

  // Determinar label del total
  const totalLabel = useMemo(() => {
    if (filters.estado) {
      return `Total ${getEstadoLabel(filters.estado)}`;
    }
    return "Total General";
  }, [filters.estado]);

  const clearFilters = () => {
    setFilters({
      razon_social: "",
      cuit: "",
      fecha: "",
      estado: "",
      monto: "",
      tipo_comprobante: "",
      numero_comprobante: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  // Cambiar estado de un item
  const handleEstadoChange = (itemId, newEstado) => {
    if (!setData) return;
    
    const currentItem = data.find((i) => i.id === itemId);
    if (!currentItem) return;

    // Si intenta cambiar de "Pagado" a otra cosa, no permitir (a menos que sea admin o similar, pero por ahora bloqueado)
    if (currentItem.estado === "pagado" && newEstado !== "pagado") {
      alert("No se puede cambiar el estado de una factura ya pagada.");
      return;
    }

    // Si es pagos y el nuevo estado es "pagado", o si es "pago_parcial"
    if (tipo === "pagos" && newEstado === "pagado") {
      // Si ya es pago parcial, abrir modal de pago directamente
      if (currentItem.estado === "pago_parcial") {
        openPaymentModal(currentItem);
        return;
      }
      
      // Si es pendiente o vencido, pedir confirmación primero
      setPendingStatusChange({ itemId, newEstado });
      setConfirmModalOpen(true);
      return;
    }

    const updatedData = data.map((item) =>
      item.id === itemId ? { ...item, estado: newEstado } : item
    );
    setData(updatedData);
  };



  // Auto-corregir estados vencidos visualmente
  useEffect(() => {
    if (!data || !setData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updates = [];
    data.forEach(item => {
      // Solo chequear si está pendiente
      if (item.estado === "pendiente") {
        const fechaEmision = new Date((item.fecha || "") + "T00:00:00");
        const plazo = item.plazo || 30;
        const vencimiento = new Date(fechaEmision);
        vencimiento.setDate(fechaEmision.getDate() + plazo);
        
        // Si vencimiento < hoy, ya venció
        if (vencimiento < today) {
           updates.push({ ...item, estado: "vencido" });
        }
      }
    });

    if (updates.length > 0) {
      const updatedData = data.map(item => {
        const update = updates.find(u => u.id === item.id);
        return update ? update : item;
      });
      // Evitar loop infinito: solo actualizar si hay cambios reales
      if (JSON.stringify(updatedData) !== JSON.stringify(data)) {
         console.log("Auto-corrigiendo estados vencidos:", updates.length);
         setData(updatedData);
      }
    }
  }, [data, setData]);

  // Función auxiliar para abrir el modal de pago
  const openPaymentModal = (item) => {
    setPaymentItem(item);
    setMetodosPago({
      efectivo: { enabled: false, monto: "" },
      transferencia: { enabled: false, monto: "" },
      cheque: { enabled: false, monto: "" }
    });
    setCheques([{ numero: "", monto: "" }]);
    setPaymentModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const { itemId, newEstado } = pendingStatusChange;
    const item = data.find((i) => i.id === itemId);
    
    setConfirmModalOpen(false);
    setPendingStatusChange(null);

    if (newEstado === "pagado") {
      openPaymentModal(item);
    } else {
      const updatedData = data.map((i) =>
        i.id === itemId ? { ...i, estado: newEstado } : i
      );
      setData(updatedData);
    }
  };

  // Toggle método de pago
  const toggleMetodo = (metodo) => {
    setMetodosPago(prev => ({
      ...prev,
      [metodo]: { ...prev[metodo], enabled: !prev[metodo].enabled }
    }));
  };

  // Actualizar monto de método
  const updateMetodoMonto = (metodo, monto) => {
    setMetodosPago(prev => ({
      ...prev,
      [metodo]: { ...prev[metodo], monto }
    }));
  };

  // Calcular total ingresado
  const totalIngresado = useMemo(() => {
    let total = 0;
    if (metodosPago.efectivo.enabled) total += parseFloat(metodosPago.efectivo.monto) || 0;
    if (metodosPago.transferencia.enabled) total += parseFloat(metodosPago.transferencia.monto) || 0;
    if (metodosPago.cheque.enabled) {
      cheques.forEach(c => total += parseFloat(c.monto) || 0);
    }
    return total;
  }, [metodosPago, cheques]);

  // Agregar cheque
  const addCheque = () => {
    setCheques([...cheques, { numero: "", monto: "" }]);
  };

  // Eliminar cheque
  const removeCheque = (index) => {
    setCheques(cheques.filter((_, i) => i !== index));
  };

  // Actualizar cheque
  const updateCheque = (index, field, value) => {
    const updated = [...cheques];
    updated[index][field] = value;
    setCheques(updated);
  };

  // Confirmar pago y generar PDF
  const confirmPayment = () => {
    if (!paymentItem || !setData) return;

    // Verificar que al menos un método esté habilitado
    const metodosActivos = Object.entries(metodosPago).filter(([_, v]) => v.enabled);
    if (metodosActivos.length === 0) {
      alert("Debe seleccionar al menos un método de pago");
      return;
    }

    // Calcular si es pago parcial
    const esPagoParcial = totalIngresado < (paymentItem.monto_restante ?? paymentItem.monto);
    const nuevoEstado = esPagoParcial ? "pago_parcial" : "pagado";
    const montoPagado = (paymentItem.monto_pagado || 0) + totalIngresado;
    const montoRestante = paymentItem.monto - montoPagado;

    // Crear registro de pago para el historial
    const nuevoPago = {
      fecha: new Date().toLocaleDateString(),
      monto: totalIngresado,
      metodos_pago: { ...metodosPago },
      cheques: metodosPago.cheque.enabled ? [...cheques] : []
    };
    
    const historialActualizado = [...(paymentItem.historial_pagos || []), nuevoPago];

    // Generar orden de pago PDF y obtener URL (pasamos el item actualizado con el historial)
    const itemActualizadoParaPDF = {
      ...paymentItem,
      historial_pagos: historialActualizado,
      monto_pagado: montoPagado,
      monto_restante: montoRestante > 0 ? montoRestante : 0
    };
    
    const pdfUrl = generatePaymentOrder(itemActualizadoParaPDF, metodosPago, cheques);

    // Actualizar estado con URL del PDF y montos
    const updatedData = data.map((item) =>
      item.id === paymentItem.id
        ? { 
            ...item, 
            estado: montoRestante <= 0 ? "pagado" : nuevoEstado, 
            metodos_pago: metodosPago, 
            cheques: metodosPago.cheque.enabled ? cheques : null,
            orden_pago_url: pdfUrl,
            monto_pagado: montoPagado,
            monto_restante: montoRestante > 0 ? montoRestante : 0,
            historial_pagos: historialActualizado
          }
        : item
    );
    setData(updatedData);

    // Cerrar modal
    setPaymentModalOpen(false);
    setPaymentItem(null);
  };

  // Generar orden de pago PDF (duplicado: emisor y receptor)
  const generatePaymentOrder = (item, metodos, chequesData) => {
    const doc = new jsPDF();
    
    const metodosLabels = {
      efectivo: "Efectivo",
      transferencia: "Transferencia Bancaria",
      cheque: "Cheque"
    };

    // Función para generar una copia
    const generateCopy = (copyType, startY = 0) => {
      const offsetY = startY;
      
      // Header
      doc.setFillColor(11, 31, 59); // brand-navy
      doc.rect(0, offsetY, 210, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("ORDEN DE PAGO", 105, offsetY + 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(`- ${copyType} -`, 105, offsetY + 30, { align: "center" });

      // Body
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      let y = offsetY + 45;
      const addField = (label, value) => {
        doc.setFont(undefined, "bold");
        doc.text(label + ":", 15, y);
        doc.setFont(undefined, "normal");
        doc.text(String(value || "-"), 65, y);
        y += 8;
      };

      addField("Fecha", item.fecha);
      addField("Razón Social", item.razon_social);
      addField("CUIT/CUIL", item.cuit);
      addField("Tipo Comprobante", getTipoComprobanteLabel(item.tipo_comprobante));
      addField("Nº Comprobante", item.numero_comprobante || "-");

      // Pagos Anteriores (si existen)
      const pagosAnteriores = item.historial_pagos ? item.historial_pagos.slice(0, -1) : [];
      if (pagosAnteriores.length > 0) {
        y += 5;
        doc.setFont(undefined, "bold");
        doc.text("PAGOS ANTERIORES REALIZADOS:", 15, y);
        y += 8;

        pagosAnteriores.forEach((pago, pIdx) => {
          doc.setFontSize(8);
          doc.setFont(undefined, "italic");
          doc.text(`Pago del ${pago.fecha}:`, 20, y);
          doc.setFont(undefined, "normal");
          doc.text(`$${pago.monto.toLocaleString()}`, 160, y, { align: "right" });
          y += 5;
        });
        y += 3;
      }

      // Pago Actual
      y += 5;
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("PAGO ACTUAL:", 15, y);
      y += 8;

      // Cabecera de tabla
      doc.setFillColor(230, 230, 230);
      doc.rect(15, y - 4, 180, 8, "F");
      doc.text("Método", 20, y);
      doc.text("Monto", 160, y, { align: "right" });
      y += 8;

      doc.setFont(undefined, "normal");
      
      // Detalles del pago actual
      if (metodos.efectivo && metodos.efectivo.enabled && metodos.efectivo.monto) {
        doc.text("Efectivo", 20, y);
        doc.text(`$${parseFloat(metodos.efectivo.monto).toLocaleString()}`, 160, y, { align: "right" });
        y += 6;
      }

      if (metodos.transferencia && metodos.transferencia.enabled && metodos.transferencia.monto) {
        doc.text("Transferencia Bancaria", 20, y);
        doc.text(`$${parseFloat(metodos.transferencia.monto).toLocaleString()}`, 160, y, { align: "right" });
        y += 6;
      }

      if (metodos.cheque && metodos.cheque.enabled && chequesData && chequesData.length > 0) {
        chequesData.forEach((cheque) => {
          if (cheque.numero || cheque.monto) {
            doc.text(`Cheque Nº ${cheque.numero || "-"}`, 20, y);
            doc.text(`$${parseFloat(cheque.monto || 0).toLocaleString()}`, 160, y, { align: "right" });
            y += 6;
          }
        });
      }

      // Monto total
      y += 5;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y - 3, 190, 15, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("MONTO TOTAL:", 15, y + 6);
      doc.setTextColor(22, 163, 74); // green
      doc.text(`$${item.monto.toLocaleString()}`, 195, y + 6, { align: "right" });

      // Información de pago parcial si existe
      if (item.monto_pagado !== undefined && item.monto_restante > 0) {
        y += 18;
        doc.setFillColor(255, 237, 213); // bg-orange-100
        doc.rect(10, y - 3, 190, 20, "F");
        doc.setTextColor(194, 65, 12); // text-orange-700
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("⚠ PAGO PARCIAL", 105, y + 3, { align: "center" });
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.text(`Monto pagado hasta ahora: $${(item.monto_pagado || 0).toLocaleString()} | Saldo restante: $${item.monto_restante.toLocaleString()}`, 105, y + 12, { align: "center" });
        y += 8;
      }

      y += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const estadoLabel = item.monto_restante > 0 ? "PAGO PARCIAL" : "PAGADO";
      doc.text(`Estado: ${estadoLabel} | Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, y);

      // Líneas de firma
      y += 12;
      doc.setDrawColor(0, 0, 0);
      doc.line(25, y + 15, 85, y + 15);
      doc.line(125, y + 15, 185, y + 15);
      doc.setFontSize(8);
      doc.text("Firma Emisor", 55, y + 22, { align: "center" });
      doc.text("Firma Receptor", 155, y + 22, { align: "center" });

      // Footer
      y += 35;
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text("Este documento es una orden de pago generada automáticamente.", 105, y, { align: "center" });
    };

    // Generar copia EMISOR (página 1)
    generateCopy("ORIGINAL - EMISOR", 0);
    
    // Agregar nueva página para el receptor
    doc.addPage();
    
    // Generar copia RECEPTOR (página 2)
    generateCopy("DUPLICADO - RECEPTOR", 0);

    // Guardar archivo
    doc.save(`orden_pago_${item.numero_comprobante || item.id}.pdf`);
    
    // Retornar blob URL para visualización posterior
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  };

  // Manejar subida de PDF (para cobrado)
  const handleFileUpload = (itemId) => {
    setUploadingItemId(itemId);
    fileInputRef.current?.click();
  };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file && uploadingItemId && setData) {
      const updatedData = data.map((item) =>
        item.id === uploadingItemId
          ? { ...item, orden_pago_pdf: file.name, orden_pago_url: URL.createObjectURL(file) }
          : item
      );
      setData(updatedData);
      alert(`PDF "${file.name}" subido correctamente`);
    }
    setUploadingItemId(null);
    e.target.value = "";
  };

  // Generar PDF de recibo de pago (para items ya pagados) - Descargar
  const generatePaymentReceipt = (item) => {
    // Usar metodos_pago si está disponible, sino crear objeto con valores por defecto
    const metodos = item.metodos_pago || {
      efectivo: { enabled: true, monto: item.monto },
      transferencia: { enabled: false, monto: "" },
      cheque: { enabled: false, monto: "" }
    };
    generatePaymentOrder(item, metodos, item.cheques || []);
  };

  // Visualizar PDF de recibo de pago (abrir en nueva pestaña)
  const viewPaymentOrder = (item) => {
    const metodos = item.metodos_pago || {
      efectivo: { enabled: true, monto: item.monto },
      transferencia: { enabled: false, monto: "" },
      cheque: { enabled: false, monto: "" }
    };
    const cheques = item.cheques || [];
    
    const doc = new jsPDF();
    
    const metodosLabels = {
      efectivo: "Efectivo",
      transferencia: "Transferencia Bancaria",
      cheque: "Cheque"
    };

    // Función para generar una copia
    const generateCopy = (copyType, startY = 0) => {
      const offsetY = startY;
      
      // Header
      doc.setFillColor(11, 31, 59);
      doc.rect(0, offsetY, 210, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("ORDEN DE PAGO", 105, offsetY + 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(`- ${copyType} -`, 105, offsetY + 30, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      let y = offsetY + 45;
      const addField = (label, value) => {
        doc.setFont(undefined, "bold");
        doc.text(label + ":", 15, y);
        doc.setFont(undefined, "normal");
        doc.text(String(value || "-"), 65, y);
        y += 8;
      };

      addField("Fecha", item.fecha);
      addField("Razón Social", item.razon_social);
      addField("CUIT/CUIL", item.cuit);
      addField("Tipo Comprobante", getTipoComprobanteLabel(item.tipo_comprobante));
      addField("Nº Comprobante", item.numero_comprobante || "-");

      // Pagos Anteriores (si existen)
      const pagosAnteriores = item.historial_pagos ? item.historial_pagos : [];
      if (pagosAnteriores.length > 0) {
        y += 5;
        doc.setFont(undefined, "bold");
        doc.text("HISTORIAL DE PAGOS:", 15, y);
        y += 8;

        pagosAnteriores.forEach((pago) => {
          doc.setFontSize(8);
          doc.setFont(undefined, "italic");
          doc.text(`Pago del ${pago.fecha}:`, 20, y);
          doc.setFont(undefined, "normal");
          doc.text(`$${pago.monto.toLocaleString()}`, 160, y, { align: "right" });
          y += 5;
        });
        y += 3;
      }

      // Nota: Para "Visualizar", si ya está pagado o en pago parcial, 
      // mostramos el resumen histórico en lugar de un "Pago Actual" duplicado.
      if (!metodos.efectivo.enabled && !metodos.transferencia.enabled && !metodos.cheque.enabled) {
        y += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("RESUMEN DE SALDOS:", 15, y);
        y += 8;
      } else {
        y += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("DETALLE DEL ÚLTIMO PAGO:", 15, y);
        y += 8;

        doc.setFillColor(230, 230, 230);
        doc.rect(15, y - 4, 180, 8, "F");
        doc.text("Método", 20, y);
        doc.text("Monto", 160, y, { align: "right" });
        y += 8;

        doc.setFont(undefined, "normal");
        
        if (metodos.efectivo && metodos.efectivo.enabled && metodos.efectivo.monto) {
          doc.text("Efectivo", 20, y);
          doc.text(`$${parseFloat(metodos.efectivo.monto).toLocaleString()}`, 160, y, { align: "right" });
          y += 6;
        }

        if (metodos.transferencia && metodos.transferencia.enabled && metodos.transferencia.monto) {
          doc.text("Transferencia Bancaria", 20, y);
          doc.text(`$${parseFloat(metodos.transferencia.monto).toLocaleString()}`, 160, y, { align: "right" });
          y += 6;
        }

        if (metodos.cheque && metodos.cheque.enabled && cheques && cheques.length > 0) {
          cheques.forEach((cheque) => {
            if (cheque.numero || cheque.monto) {
              doc.text(`Cheque Nº ${cheque.numero || "-"}`, 20, y);
              doc.text(`$${parseFloat(cheque.monto || 0).toLocaleString()}`, 160, y, { align: "right" });
              y += 6;
            }
          });
        }
      }

      y += 5;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y - 3, 190, 15, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("MONTO TOTAL:", 15, y + 6);
      doc.setTextColor(22, 163, 74);
      doc.text(`$${item.monto.toLocaleString()}`, 195, y + 6, { align: "right" });

      // Información de pago parcial si existe
      if (item.monto_pagado !== undefined && item.monto_restante > 0) {
        y += 18;
        doc.setFillColor(255, 237, 213); // bg-orange-100
        doc.rect(10, y - 3, 190, 20, "F");
        doc.setTextColor(194, 65, 12); // text-orange-700
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("⚠ PAGO PARCIAL", 105, y + 3, { align: "center" });
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.text(`Monto pagado hasta ahora: $${(item.monto_pagado || 0).toLocaleString()} | Saldo restante: $${item.monto_restante.toLocaleString()}`, 105, y + 12, { align: "center" });
        y += 8;
      }

      y += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const estadoLabel = item.monto_restante > 0 ? "PAGO PARCIAL" : "PAGADO";
      doc.text(`Estado: ${estadoLabel} | Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, y);

      y += 12;
      doc.setDrawColor(0, 0, 0);
      doc.line(25, y + 15, 85, y + 15);
      doc.line(125, y + 15, 185, y + 15);
      doc.setFontSize(8);
      doc.text("Firma Emisor", 55, y + 22, { align: "center" });
      doc.text("Firma Receptor", 155, y + 22, { align: "center" });

      y += 35;
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text("Este documento es una orden de pago generada automáticamente.", 105, y, { align: "center" });
    };

    generateCopy("ORIGINAL - EMISOR", 0);
    doc.addPage();
    generateCopy("DUPLICADO - RECEPTOR", 0);

    // Abrir en nueva pestaña en lugar de descargar
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="bg-content1 rounded-lg shadow border border-divider overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        onChange={onFileSelected}
        className="hidden"
      />

      {/* Modal de método de pago */}
      <Modal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 bg-brand-navy text-white">
            <span className="text-xl">Registrar Pago</span>
            {paymentItem && (
              <span className="text-sm font-normal opacity-80">
                {paymentItem.razon_social} - ${paymentItem.monto?.toLocaleString()}
              </span>
            )}
          </ModalHeader>
          <ModalBody className="py-6">
            {/* Instrucciones */}
            <p className="text-sm text-default-500 mb-4">
              Seleccione los métodos de pago y complete los montos correspondientes.
            </p>

            {/* Efectivo */}
            <div className={`p-3 rounded-lg border-2 mb-3 transition-all ${
              metodosPago.efectivo.enabled ? "border-brand-navy bg-brand-navy/5" : "border-divider"
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={metodosPago.efectivo.enabled}
                    onChange={() => toggleMetodo("efectivo")}
                    className="w-4 h-4 accent-brand-navy"
                  />
                  <HiCash size={22} className={metodosPago.efectivo.enabled ? "text-brand-navy" : "text-default-400"} />
                  <span className={`font-medium ${metodosPago.efectivo.enabled ? "text-brand-navy" : "text-foreground"}`}>
                    Efectivo
                  </span>
                </label>
                {metodosPago.efectivo.enabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Monto"
                      value={metodosPago.efectivo.monto}
                      onChange={(e) => updateMetodoMonto("efectivo", e.target.value)}
                      className="w-28 px-3 py-1 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy text-right"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const totalADeber = paymentItem?.monto_restante ?? paymentItem?.monto ?? 0;
                        const otrosMetodos = (metodosPago.transferencia.enabled ? parseFloat(metodosPago.transferencia.monto) || 0 : 0) + 
                                            (metodosPago.cheque.enabled ? cheques.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0) : 0);
                        updateMetodoMonto("efectivo", String(Math.max(0, totalADeber - otrosMetodos)));
                      }}
                      className="px-2 py-1 text-xs bg-brand-navy text-white rounded hover:bg-brand-navy/80 transition"
                      title="Poner el total"
                    >
                      Total
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transferencia */}
            <div className={`p-3 rounded-lg border-2 mb-3 transition-all ${
              metodosPago.transferencia.enabled ? "border-brand-navy bg-brand-navy/5" : "border-divider"
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={metodosPago.transferencia.enabled}
                    onChange={() => toggleMetodo("transferencia")}
                    className="w-4 h-4 accent-brand-navy"
                  />
                  <HiCreditCard size={22} className={metodosPago.transferencia.enabled ? "text-brand-navy" : "text-default-400"} />
                  <span className={`font-medium ${metodosPago.transferencia.enabled ? "text-brand-navy" : "text-foreground"}`}>
                    Transferencia
                  </span>
                </label>
                {metodosPago.transferencia.enabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Monto"
                      value={metodosPago.transferencia.monto}
                      onChange={(e) => updateMetodoMonto("transferencia", e.target.value)}
                      className="w-28 px-3 py-1 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy text-right"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const totalADeber = paymentItem?.monto_restante ?? paymentItem?.monto ?? 0;
                        const otrosMetodos = (metodosPago.efectivo.enabled ? parseFloat(metodosPago.efectivo.monto) || 0 : 0) + 
                                            (metodosPago.cheque.enabled ? cheques.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0) : 0);
                        updateMetodoMonto("transferencia", String(Math.max(0, totalADeber - otrosMetodos)));
                      }}
                      className="px-2 py-1 text-xs bg-brand-navy text-white rounded hover:bg-brand-navy/80 transition"
                      title="Poner el total"
                    >
                      Total
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cheque */}
            <div className={`p-3 rounded-lg border-2 mb-3 transition-all ${
              metodosPago.cheque.enabled ? "border-brand-navy bg-brand-navy/5" : "border-divider"
            }`}>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={metodosPago.cheque.enabled}
                    onChange={() => toggleMetodo("cheque")}
                    className="w-4 h-4 accent-brand-navy"
                  />
                  <HiDocument size={22} className={metodosPago.cheque.enabled ? "text-brand-navy" : "text-default-400"} />
                  <span className={`font-medium ${metodosPago.cheque.enabled ? "text-brand-navy" : "text-foreground"}`}>
                    Cheque
                  </span>
                </label>
              </div>
              
              {/* Detalle de cheques */}
              {metodosPago.cheque.enabled && (
                <div className="mt-4 ml-8 space-y-3">
                  {cheques.map((cheque, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nº Cheque"
                        value={cheque.numero}
                        onChange={(e) => updateCheque(index, "numero", e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy"
                      />
                      <input
                        type="number"
                        placeholder="Monto"
                        value={cheque.monto}
                        onChange={(e) => updateCheque(index, "monto", e.target.value)}
                        className="w-24 px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy text-right"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const totalADeber = paymentItem?.monto_restante ?? paymentItem?.monto ?? 0;
                          const otrosMetodos = (metodosPago.efectivo.enabled ? parseFloat(metodosPago.efectivo.monto) || 0 : 0) + 
                                              (metodosPago.transferencia.enabled ? parseFloat(metodosPago.transferencia.monto) || 0 : 0) +
                                              cheques.reduce((acc, c, i) => acc + (i !== index ? (parseFloat(c.monto) || 0) : 0), 0);
                          updateCheque(index, "monto", String(Math.max(0, totalADeber - otrosMetodos)));
                        }}
                        className="px-2 py-1 text-xs bg-brand-navy text-white rounded hover:bg-brand-navy/80 transition"
                        title="Poner el total"
                      >
                        Total
                      </button>
                      {cheques.length > 1 && (
                        <button
                          onClick={() => removeCheque(index)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                        >
                          <HiX size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addCheque}
                    className="text-sm text-brand-navy font-medium hover:underline"
                  >
                    + Agregar cheque
                  </button>
                </div>
              )}
            </div>

            {/* Resumen de totales */}
            <div className="mt-4 p-3 bg-content2 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-default-500">Total ingresado:</span>
                <span className={`font-bold ${totalIngresado === (paymentItem?.monto_restante ?? paymentItem?.monto) ? "text-green-600" : "text-foreground"}`}>
                  ${totalIngresado.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-default-500">
                  {paymentItem?.monto_restante ? "Monto restante:" : "Monto a pagar:"}
                </span>
                <span className="font-bold text-brand-navy">
                  ${(paymentItem?.monto_restante ?? paymentItem?.monto)?.toLocaleString()}
                </span>
              </div>
              {paymentItem?.monto_pagado > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-default-500">Ya pagado:</span>
                  <span className="font-bold text-green-600">${paymentItem.monto_pagado.toLocaleString()}</span>
                </div>
              )}
              {totalIngresado !== (paymentItem?.monto_restante ?? paymentItem?.monto) && totalIngresado > 0 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-divider">
                  <span className="text-sm text-default-500">Diferencia:</span>
                  <span className={`font-bold ${totalIngresado > (paymentItem?.monto_restante ?? paymentItem?.monto) ? "text-yellow-600" : "text-red-600"}`}>
                    ${Math.abs((paymentItem?.monto_restante ?? paymentItem?.monto) - totalIngresado).toLocaleString()}
                  </span>
                </div>
              )}
              {totalIngresado > 0 && totalIngresado < (paymentItem?.monto_restante ?? paymentItem?.monto) && (
                <div className="mt-2 p-2 bg-orange-100 text-orange-700 rounded text-sm text-center">
                  ⚠️ Pago parcial: quedará un saldo de ${((paymentItem?.monto_restante ?? paymentItem?.monto) - totalIngresado).toLocaleString()}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-brand-navy text-white hover:bg-brand-navy/80"
              onPress={confirmPayment}
            >
              Confirmar y Generar Orden
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Header */}
      <div className="px-4 py-3 border-b border-divider flex justify-between items-center">
        <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-secondary hover:text-secondary/80 transition"
          >
            <HiX size={16} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-content2 border-b border-divider grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={16} />
          <input
            type="text"
            placeholder="Razón Social"
            value={filters.razon_social}
            onChange={(e) => setFilters({ ...filters, razon_social: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={16} />
          <input
            type="text"
            placeholder="CUIT/CUIL"
            value={filters.cuit}
            onChange={(e) => setFilters({ ...filters, cuit: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <input
          type="date"
          value={filters.fecha}
          onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        />
        <select
          value={filters.tipo_comprobante}
          onChange={(e) => setFilters({ ...filters, tipo_comprobante: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {tipoComprobanteOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={16} />
          <input
            type="text"
            placeholder="Nº Comprobante"
            value={filters.numero_comprobante}
            onChange={(e) => setFilters({ ...filters, numero_comprobante: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <select
          value={filters.estado}
          onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {estadoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Monto mínimo"
          value={filters.monto}
          onChange={(e) => setFilters({ ...filters, monto: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-brand-navy">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase">
                Tipo Comp.
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase">
                Nº Comp.
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase">
                Razón Social
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase">
                CUIT/CUIL
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase">
                Monto
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-default-500">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="bg-content1 hover:bg-content2 transition-colors border-b border-divider"
                >
                  <td className="px-4 py-3 text-sm text-foreground">{item.fecha}</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {getTipoComprobanteLabel(item.tipo_comprobante)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono">
                    {item.numero_comprobante || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {item.razon_social}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{item.cuit}</td>
                  <td className="px-4 py-3 text-center">
                      <select
                        value={item.estado}
                        onChange={(e) => handleEstadoChange(item.id, e.target.value)}
                        disabled={!setData || item.estado === "pagado"}
                        className={`px-2 py-1 rounded text-xs font-bold border-0 bg-transparent cursor-pointer ${getEstadoColor(item.estado)} ${item.estado === "pagado" ? "cursor-not-allowed opacity-80" : ""}`}
                      >
                        {item.estado === "pendiente" && <option value="pendiente" className="text-yellow-600">Pendiente</option>}
                        {item.estado === "vencido" && <option value="vencido" className="text-red-600">Vencido</option>}
                        {item.estado === "pago_parcial" && <option value="pago_parcial" className="text-orange-600">Pago Parcial</option>}
                        
                        {/* Solo permitir cambiar a Pagado/Cobrado */}
                        {tipo === "cobranzas" ? (
                          item.estado !== "pagado" && item.estado !== "cobrado" && <option value="cobrado" className="text-green-600">Cobrado</option>
                        ) : (
                          item.estado !== "pagado" && <option value="pagado" className="text-green-600">Pagado</option>
                        )}

                        {item.estado === "pagado" && <option value="pagado" className="text-green-600">Pagado</option>}
                        {item.estado === "cobrado" && <option value="cobrado" className="text-green-600">Cobrado</option>}
                      </select>
                      
                      {/* Indicador visual de vencimiento debajo del select */}
                      {(() => {
                         if (item.estado === "pagado" || item.estado === "cobrado") return null;
                         
                         const fechaEmision = new Date((item.fecha || "") + "T00:00:00");
                         const plazo = item.plazo || 30;
                         const vencimiento = new Date(fechaEmision);
                         vencimiento.setDate(fechaEmision.getDate() + plazo);
                         
                         const today = new Date();
                         today.setHours(0,0,0,0);
                         
                         const timeDiff = vencimiento - today;
                         const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                         const isExpired = daysDiff < 0;
                         const isNear = daysDiff >= 0 && daysDiff <= 5;

                         if (!isExpired && !isNear) return null;

                         return (
                           <div className="flex flex-col items-center mt-1">
                             <span className={`text-[9px] font-bold ${isExpired ? "text-red-600" : "text-orange-500"}`}>
                               {isExpired ? "VENCIDO" : "POR VENCER"}
                             </span>
                             <span className="text-[9px] text-default-400 leading-tight">
                               {vencimiento.toLocaleDateString()}
                             </span>
                           </div>
                         )
                      })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {item.estado === "pago_parcial" && item.monto_restante ? (
                      <div>
                        <span className="text-orange-600">${item.monto_restante.toLocaleString()}</span>
                        <span className="text-xs text-default-500 block">
                          (pagado: ${item.monto_pagado?.toLocaleString() || 0})
                        </span>
                      </div>
                    ) : (
                      `$${item.monto.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Si es cobrado (cobranzas) - Subir PDF */}
                      {tipo === "cobranzas" && item.estado === "cobrado" && (
                        <>
                          <button
                            onClick={() => handleFileUpload(item.id)}
                            className="p-1 text-blue-500 hover:text-blue-700 transition"
                            title="Subir orden de pago (PDF)"
                          >
                            <HiUpload size={18} />
                          </button>
                          {item.orden_pago_pdf && (
                            <a
                              href={item.orden_pago_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-green-500 hover:text-green-700 transition"
                              title={`Ver: ${item.orden_pago_pdf}`}
                            >
                              <HiDocument size={18} />
                            </a>
                          )}
                        </>
                      )}
                      {/* Si es pagado o pago_parcial (pagos) - Ver/Descargar PDF */}
                      {tipo === "pagos" && (item.estado === "pagado" || item.estado === "pago_parcial") && (
                        <>
                          <button
                            onClick={() => viewPaymentOrder(item)}
                            className="p-1 text-blue-500 hover:text-blue-700 transition"
                            title="Ver orden de pago"
                          >
                            <HiDocument size={18} />
                          </button>
                          <button
                            onClick={() => generatePaymentReceipt(item)}
                            className="p-1 text-green-500 hover:text-green-700 transition"
                            title="Descargar orden de pago (PDF)"
                          >
                            <HiDocumentDownload size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Total */}
      <div className="px-4 py-4 bg-content2 border-t border-divider flex justify-end items-center gap-4">
        <span className="text-sm font-medium text-default-500">{totalLabel}:</span>
        <span className="text-xl font-bold text-brand-navy">${total.toLocaleString()}</span>
      </div>
      {/* Modal de confirmación para estado FINAL */}
      <Modal 
        isOpen={confirmModalOpen} 
        onOpenChange={setConfirmModalOpen}
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-red-600">
            ⚠ Confirmar Estado Final
          </ModalHeader>
          <ModalBody>
            <p className="text-foreground">
              Si cambia el estado a <span className="font-bold text-green-600">Pagado</span>, no podrá volver a cambiar el estado de esta factura.
            </p>
            <p className="text-sm text-default-500 mt-2">
              Esto asegura que no se generen duplicados de órdenes de pago y que el registro sea definitivo.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => {
                setConfirmModalOpen(false);
                setPendingStatusChange(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-brand-navy text-white"
              onPress={confirmStatusChange}
            >
              Confirmar y Continuar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
