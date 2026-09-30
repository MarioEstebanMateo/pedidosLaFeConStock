import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../db/SupabaseClient';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoLaFe from '../assets/img/logo-lafe.png';

// Product categories configuration matching the existing system
const PRODUCT_CATEGORIES = [
  { name: 'helados', displayName: 'Helados', column: 'left' },
  { name: 'palitos', displayName: 'Palitos', column: 'right' },
  { name: 'postres', displayName: 'Postres', column: 'right' },
  { name: 'crocker', displayName: 'Crocker', column: 'right' },
  { name: 'dieteticos', displayName: 'Dietéticos', column: 'right' },
  { name: 'buffet', displayName: 'Buffet', column: 'right' },
  { name: 'softs', displayName: 'Softs y Yogurts', column: 'right' },
  { name: 'dulces', displayName: 'Dulces', column: 'right' },
  { name: 'paletas', displayName: 'Paletas', column: 'right' },
  { name: 'bites', displayName: 'Bites', column: 'right' },
  { name: 'barritas', displayName: 'Barritas', column: 'right' },
  { name: 'termicos', displayName: 'Térmicos', column: 'right' }
];

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${dayNames[date.getUTCDay()]} ${day} de ${monthNames[date.getUTCMonth()]} de ${year}`;
};

const formatDateTimeArgentina = (dateString) => {
  if (!dateString) return 'Sin registrar';
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Sumar 3 horas para mostrar hora correcta
    date.setHours(date.getHours() + 3);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Error en fecha';
  }
};

// Helper function to sort products by ID
const sortProductsByID = (products) => {
  return [...products].sort((a, b) => a.id - b.id);
};

// Available table suffixes
const TABLE_SUFFIXES = [
  { value: '_centro', label: 'Centro' },
  { value: '_caba', label: 'CABA' }
];

const getSupabaseErrorMessage = (error, fallback) => {
  if (error?.code === '42501' || error?.message?.toLowerCase().includes('row-level security')) {
    return 'Supabase rechazó la operación por permisos RLS. Ejecuta la migración SQL de políticas del proyecto.';
  }

  return error?.message ? `${fallback}: ${error.message}` : fallback;
};

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminMode, setAdminMode] = useState('productos'); // 'productos', 'sucursales' or 'historial'
  const [tableSuffix, setTableSuffix] = useState('_centro');
  const [currentCategory, setCurrentCategory] = useState(PRODUCT_CATEGORIES[0].name);
  const [products, setProducts] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('fecha_creacion');
  const [sortDirection, setSortDirection] = useState('desc');
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductStockMin, setNewProductStockMin] = useState(0);
  const [newProductVisible, setNewProductVisible] = useState(true);
  const [newSucursalTitle, setNewSucursalTitle] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Check authentication when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Check if we have admin session in localStorage
      const adminSession = localStorage.getItem('adminSession');
      
      if (adminSession) {
        try {
          // Verify the stored session is still valid
          const sessionData = JSON.parse(adminSession);
          const { username } = sessionData;
          
          // Verify this username exists in the admin table
          const { data, error } = await supabase
            .from('admin_centro')
            .select('username')
            .eq('username', username)
            .single();
          
          if (error || !data) {
            // Invalid session or admin no longer exists
            localStorage.removeItem('adminSession');
            navigate('/admin-login');
            return;
          }
          
          // Valid admin - proceed
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error verifying session:', error);
          localStorage.removeItem('adminSession');
          navigate('/admin-login');
          return;
        }
      } else {
        // No session found, redirect to login
        navigate('/admin-login');
        return;
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate]);
  
  // Load products/sucursales when category, mode or suffix changes (but only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      if (adminMode === 'productos') {
        loadProducts(currentCategory, tableSuffix);
      } else if (adminMode === 'sucursales') {
        loadSucursales();
      }
    }
  }, [currentCategory, tableSuffix, adminMode, isAuthenticated]);
  
  const loadProducts = async (category, suffix) => {
    try {
      setIsLoading(true);
      const tableName = category + suffix;
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(`Error loading ${category}${suffix}:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudieron cargar los ${PRODUCT_CATEGORIES.find(c => c.name === category).displayName}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSucursales = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setSucursales(data || []);
    } catch (error) {
      console.error('Error loading sucursales:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las sucursales'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPedidos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('fecha_creacion', { ascending: false, nullsLast: true });
      
      if (error) throw error;
      setPedidos(data || []);
      setSelectedPedido(null);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      console.error('Error loading pedidos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los pedidos'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const deletePedido = async (pedidoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: `¿Estás seguro de que deseas eliminar el pedido #${pedidoId}? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      
      if (result.isConfirmed) {
        setIsLoading(true);
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .eq('id', pedidoId);
        
        if (error) throw error;
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El pedido ha sido eliminado exitosamente'
        });
        
        loadPedidos();
      }
    } catch (error) {
      console.error('Error deleting pedido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el pedido'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const deletePedidosByDateRange = async () => {
    if (!fechaDesde || !fechaHasta) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas incompletas',
        text: 'Por favor selecciona las fechas "desde" y "hasta"'
      });
      return;
    }
    
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);
    
    if (hasta < desde) {
      Swal.fire({
        icon: 'error',
        title: 'Fechas inválidas',
        text: 'La fecha "Hasta" debe ser igual o posterior a la fecha "Desde"'
      });
      return;
    }
    
    try {
      const desdeConHora = new Date(fechaDesde + 'T00:00:00');
      const hastaConHora = new Date(fechaHasta + 'T23:59:59');
      
      const pedidosEnRango = pedidos.filter(pedido => {
        const fechaPedido = new Date(pedido.fecha_creacion || pedido.createdat);
        return fechaPedido >= desdeConHora && fechaPedido <= hastaConHora;
      });
      
      if (pedidosEnRango.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin resultados',
          text: 'No hay pedidos en el rango de fechas seleccionado'
        });
        return;
      }
      
      const result = await Swal.fire({
        title: '¿Eliminar pedidos?',
        html: `Se van a eliminar <strong>${pedidosEnRango.length}</strong> pedidos del ${fechaDesde} al ${fechaHasta}. Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar todos',
        cancelButtonText: 'Cancelar'
      });
      
      if (result.isConfirmed) {
        setIsLoading(true);
        
        const { error } = await supabase
          .from('pedidos')
          .delete()
          .in('id', pedidosEnRango.map(p => p.id));
        
        if (error) throw error;
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminados',
          text: `Se eliminaron ${pedidosEnRango.length} pedidos exitosamente`
        });
        
        setFechaDesde('');
        setFechaHasta('');
        loadPedidos();
      }
    } catch (error) {
      console.error('Error deleting pedidos by range:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron eliminar los pedidos'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sorting by column
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Sort by new column, default ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Get sorted and paginated pedidos
  const getSortedAndPaginatedPedidos = () => {
    let sorted = [...pedidos];
    
    // Sort by column
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'fecha_creacion':
          aValue = new Date(a.fecha_creacion);
          bValue = new Date(b.fecha_creacion);
          break;
        case 'cliente':
          aValue = (a.cliente_personalizado || a.sucursal || '').toLowerCase();
          bValue = (b.cliente_personalizado || b.sucursal || '').toLowerCase();
          break;
        case 'items':
          aValue = Object.values(a.productos).reduce((sum, products) => {
            return sum + (products ? products.reduce((s, p) => s + p.quantity, 0) : 0);
          }, 0);
          bValue = Object.values(b.productos).reduce((sum, products) => {
            return sum + (products ? products.reduce((s, p) => s + p.quantity, 0) : 0);
          }, 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };
  
  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(pedidos.length / itemsPerPage);
  };
  
  // Sort indicator for headers
  const getSortIndicator = (column) => {
    if (sortColumn !== column) return ' ⟷';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
  };
  
  const generarPDFPedido = (pedido) => {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm',
      margins: { top: 1, bottom: 1, left: 1, right: 1 }
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add logo
    const imgData = logoLaFe;
    const imgWidth = pageWidth / 4 * 0.6;
    const imgHeight = imgWidth * 0.6;
    const imgX = 5;
    const imgY = 5;
    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
    
    // Add document title
    doc.setFontSize(10);
    
    const clientText = pedido.cliente_personalizado 
      ? `Cliente: ${pedido.cliente_personalizado}`
      : `Sucursal: ${pedido.sucursal}`;
    const fechaText = `Fecha de entrega: ${formatDate(pedido.fecha_entrega)}`;
    
    const textWidth1 = doc.getStringUnitWidth(clientText) * 10 / doc.internal.scaleFactor;
    const textWidth2 = doc.getStringUnitWidth(fechaText) * 10 / doc.internal.scaleFactor;
    
    doc.text(clientText, (pageWidth - textWidth1) / 2, 10);
    doc.text(fechaText, (pageWidth - textWidth2) / 2, 18);
    
    // Create table data for left and right columns
    const leftTableData = [['Producto', 'Cant', 'Kgs']];
    const rightTableData = [['Producto', 'Cant', 'Kgs']];
    
    const totalProducts = PRODUCT_CATEGORIES.reduce((count, category) => 
      count + (pedido.productos[category.name]?.length || 0), 0);
    
    const useTinyFont = totalProducts > 50;
    const baseFontSize = useTinyFont ? 7 : 8;
    const headerFontSize = useTinyFont ? 7 : 8;
    const cellPadding = useTinyFont ? 1 : 1.5;
    
    // Add products to appropriate column
    PRODUCT_CATEGORIES.forEach(category => {
      const { name, displayName, column } = category;
      const products = pedido.productos[name] || [];
      
      if (products.length > 0) {
        const targetTable = column === 'left' ? leftTableData : rightTableData;
        
        targetTable.push([{ 
          content: displayName, 
          colSpan: 3, 
          styles: { 
            fontStyle: 'bold', 
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255], 
            halign: 'center' 
          } 
        }]);
        
        const sortedProducts = sortProductsByID(products);
        sortedProducts.forEach(item => {
          targetTable.push([item.title, item.quantity, '']);
        });
      }
    });
    
    // Calculate total for Cant column
    let leftCantTotal = 0;
    for (let i = 1; i < leftTableData.length; i++) {
      const row = leftTableData[i];
      if (Array.isArray(row) && typeof row[1] !== 'undefined' && !isNaN(Number(row[1]))) {
        leftCantTotal += Number(row[1]);
      }
    }

    if (leftTableData.length > 1) {
      leftTableData.push([
        { content: 'Total', colSpan: 1, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: leftCantTotal.toString(), styles: { fontStyle: 'bold', halign: 'center' } },
        ''
      ]);
    }
    
    // Draw left column table
    if (leftTableData.length > 1) {
      autoTable(doc, {
        startY: 25,
        margin: { left: 5, right: pageWidth / 2 + 1 },
        head: [leftTableData[0]],
        body: leftTableData.slice(1),
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255], 
          fontSize: headerFontSize,
          cellPadding: cellPadding,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          halign: 'center'
        },
        styles: {
          fontSize: baseFontSize,
          cellPadding: cellPadding,
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 12, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' }
        },
        tableWidth: (pageWidth / 2)
      });
    }
    
    // Draw right column table
    let rightTableEndY = 25;
    if (rightTableData.length > 1) {
      autoTable(doc, {
        startY: 25,
        margin: { left: pageWidth / 2 - 1, right: 5 },
        head: [rightTableData[0]],
        body: rightTableData.slice(1),
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255], 
          fontSize: headerFontSize,
          cellPadding: cellPadding,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          halign: 'center'
        },
        styles: {
          fontSize: baseFontSize,
          cellPadding: cellPadding,
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 12, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' }
        },
        tableWidth: (pageWidth / 2),
        didDrawPage: (data) => {
          rightTableEndY = data.cursor.y;
        }
      });
    }

    if (pedido.observaciones && pedido.observaciones.trim() !== '') {
      const obsY = Math.max(rightTableEndY + 10, 60);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text('Observaciones:', pageWidth / 2 + 5, obsY);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(pedido.observaciones, pageWidth / 2 + 5, obsY + 7, { maxWidth: pageWidth / 2 - 10 });
    }
    
    doc.save(`Pedido_LaFe_${pedido.sucursal || pedido.cliente_personalizado}_${formatDate(pedido.fecha_entrega).replace(/\//g, '-')}_reimpresion_admin.pdf`);
  };
  
  const handleAdminModeChange = (mode) => {
    setAdminMode(mode);
    if (mode === 'historial') {
      loadPedidos();
    }
  };
  
  const handleAddProduct = async () => {
    if (!newProductTitle.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor ingresa un nombre para el producto'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const tableName = currentCategory + tableSuffix;
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ 
          title: newProductTitle.trim(),
          stock_min: newProductStockMin,
          visible: newProductVisible
        }])
        .select();
      
      if (error) throw error;

      if (!data?.[0]) {
        throw new Error('Supabase no devolvió el producto creado. Revisa las políticas INSERT/SELECT.');
      }
      
      setProducts([...products, data[0]]);
      setNewProductTitle('');
      setNewProductStockMin(0);
      setNewProductVisible(true);
      
      Swal.fire({
        icon: 'success',
        title: 'Producto agregado',
        text: `${newProductTitle} ha sido agregado a ${PRODUCT_CATEGORIES.find(c => c.name === currentCategory).displayName}`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error adding product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getSupabaseErrorMessage(error, 'No se pudo agregar el producto')
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditProduct = async (id, currentTitle, currentStockMin, currentVisible) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar producto',
      html:
        `<input id="swal-input-title" class="swal2-input" value="${currentTitle}" placeholder="Nombre del producto">` +
        `<input id="swal-input-stock" type="number" class="swal2-input" value="${currentStockMin || 0}" placeholder="Stock mínimo">` +
        `<div style="margin: 20px 0;"><label style="display: flex; align-items: center; justify-content: center; gap: 10px;"><input type="checkbox" id="swal-input-visible" ${currentVisible !== false ? 'checked' : ''}><span>Visible en el Home</span></label></div>`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-input-title').value;
        const stockMin = document.getElementById('swal-input-stock').value;
        const visible = document.getElementById('swal-input-visible').checked;
        if (!title) {
          Swal.showValidationMessage('Debes ingresar un nombre');
        }
        return { title, stockMin: parseInt(stockMin) || 0, visible };
      }
    });
    
    if (formValues && (formValues.title !== currentTitle || formValues.stockMin !== currentStockMin || formValues.visible !== currentVisible)) {
      try {
        setIsLoading(true);
        const tableName = currentCategory + tableSuffix;
        
        const { error } = await supabase
          .from(tableName)
          .update({ 
            title: formValues.title,
            stock_min: formValues.stockMin,
            visible: formValues.visible
          })
          .eq('id', id);
        
        if (error) throw error;
        
        setProducts(products.map(product => 
          product.id === id ? { ...product, title: formValues.title, stock_min: formValues.stockMin, visible: formValues.visible } : product
        ));
        
        Swal.fire({
          icon: 'success',
          title: 'Producto actualizado',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        console.error('Error updating product:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: getSupabaseErrorMessage(error, 'No se pudo actualizar el producto')
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleToggleVisible = async (id, currentVisible) => {
    try {
      setIsLoading(true);
      const tableName = currentCategory + tableSuffix;
      const newVisible = !currentVisible;
      
      const { error } = await supabase
        .from(tableName)
        .update({ visible: newVisible })
        .eq('id', id);
      
      if (error) throw error;
      
      setProducts(products.map(product => 
        product.id === id ? { ...product, visible: newVisible } : product
      ));
      
      Swal.fire({
        icon: 'success',
        title: newVisible ? 'Producto visible' : 'Producto oculto',
        showConfirmButton: false,
        timer: 1000
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getSupabaseErrorMessage(error, 'No se pudo cambiar la visibilidad del producto')
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteProduct = async (id, title) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar "${title}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const tableName = currentCategory + tableSuffix;
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        setProducts(products.filter(product => product.id !== id));
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: `${title} ha sido eliminado`,
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el producto'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Sucursales handlers
  const handleAddSucursal = async () => {
    if (!newSucursalTitle.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor ingresa un nombre para la sucursal'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('sucursales')
        .insert([{ title: newSucursalTitle.trim() }])
        .select();
      
      if (error) throw error;
      
      setSucursales([...sucursales, data[0]]);
      setNewSucursalTitle('');
      
      Swal.fire({
        icon: 'success',
        title: 'Sucursal agregada',
        text: `${newSucursalTitle} ha sido agregada`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error adding sucursal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar la sucursal'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSucursal = async (id, currentTitle) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Editar sucursal',
      input: 'text',
      inputValue: currentTitle,
      inputPlaceholder: 'Ingresa el nuevo nombre',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un nombre';
        }
      }
    });
    
    if (newTitle && newTitle !== currentTitle) {
      try {
        setIsLoading(true);
        
        const { error } = await supabase
          .from('sucursales')
          .update({ title: newTitle })
          .eq('id', id);
        
        if (error) throw error;
        
        setSucursales(sucursales.map(sucursal => 
          sucursal.id === id ? { ...sucursal, title: newTitle } : sucursal
        ));
        
        Swal.fire({
          icon: 'success',
          title: 'Sucursal actualizada',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        console.error('Error updating sucursal:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la sucursal'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteSucursal = async (id, title) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la sucursal "${title}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        
        const { error } = await supabase
          .from('sucursales')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        setSucursales(sucursales.filter(sucursal => sucursal.id !== id));
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: `${title} ha sido eliminada`,
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        console.error('Error deleting sucursal:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la sucursal'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro que deseas salir del panel administrativo?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminSession');
        setIsAuthenticated(false);
        navigate('/');
      }
    });
  };
  
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will be redirected to login
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto p-4 font-sans">
      <div className="flex flex-col items-center mb-6">
        <img src={logoLaFe} alt="Logo La Fe" className="w-32 mb-3" />
        <h1 className="text-2xl md:text-3xl text-[#2c3e50] mb-1 text-center">Panel Administrativo</h1>
      </div>
      
      {/* Mode Selection Buttons */}
      <div className="mb-6 flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => handleAdminModeChange('productos')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            adminMode === 'productos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Gestión de Productos
        </button>
        <button
          onClick={() => handleAdminModeChange('sucursales')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            adminMode === 'sucursales'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Gestión de Sucursales
        </button>
        <button
          onClick={() => handleAdminModeChange('historial')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            adminMode === 'historial'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Historial de Pedidos
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2c3e50]">
            {adminMode === 'productos' 
              ? `Gestión de ${PRODUCT_CATEGORIES.find(c => c.name === currentCategory).displayName}`
            : adminMode === 'sucursales'
            ? 'Gestión de Sucursales'
            : 'Historial de Pedidos'}
          </h2>
          <button 
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
        
        {/* Products Management Section */}
        {adminMode === 'productos' && (
          <>
            {/* Selector de Sucursal */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Sucursal:
              </label>
              <div className="flex gap-2">
                {TABLE_SUFFIXES.map((suffix) => (
                  <button
                    key={suffix.value}
                    onClick={() => setTableSuffix(suffix.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tableSuffix === suffix.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {suffix.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6 overflow-x-auto">
              <div className="flex flex-wrap gap-2 pb-3">
                {PRODUCT_CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      currentCategory === category.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.displayName}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newProductTitle}
                  onChange={(e) => setNewProductTitle(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded"
                  placeholder={`Nuevo ${PRODUCT_CATEGORIES.find(c => c.name === currentCategory).displayName.slice(0, -1)}...`}
                />
                <input
                  type="number"
                  value={newProductStockMin}
                  onChange={(e) => setNewProductStockMin(parseInt(e.target.value) || 0)}
                  className="w-32 p-2 border border-gray-300 rounded"
                  placeholder="Stock mín"
                  min="0"
                />
                <button
                  onClick={handleAddProduct}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Agregar
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newProductVisible}
                  onChange={(e) => setNewProductVisible(e.target.checked)}
                  className="w-4 h-4"
                />
                Visible en el Home
              </label>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-center">Stock Mínimo</th>
                    <th className="py-3 px-4 text-center">Visible</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    <>
                      {products.map((product) => (
                        <tr key={product.id} className={`border-b hover:bg-gray-50 ${product.visible === false ? 'bg-gray-100' : ''}`}>
                          <td className="py-2 px-4">{product.id}</td>
                          <td className="py-2 px-4">{product.title}</td>
                          <td className="py-2 px-4 text-center">{product.stock_min || 0}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleToggleVisible(product.id, product.visible)}
                              className={`py-1 px-3 rounded text-sm font-medium transition-colors ${
                                product.visible !== false 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {product.visible !== false ? '👁️ Visible' : '🚫 Oculto'}
                            </button>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleEditProduct(product.id, product.title, product.stock_min, product.visible)}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mr-2 text-sm transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.title)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentCategory === 'helados' && products.length > 0 && (
                        <tr className="bg-blue-100 border-t-2 border-blue-500 font-bold">
                          <td colSpan="2" className="py-3 px-4 text-right">TOTAL STOCK MÍNIMO:</td>
                          <td className="py-3 px-4 text-center text-blue-700">
                            {products.reduce((sum, product) => sum + (product.stock_min || 0), 0)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">
                        No hay productos en esta categoría
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Sucursales Management Section */}
        {adminMode === 'sucursales' && (
          <>
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={newSucursalTitle}
                onChange={(e) => setNewSucursalTitle(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Nueva sucursal..."
              />
              <button
                onClick={handleAddSucursal}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
              >
                Agregar
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sucursales.length > 0 ? (
                    sucursales.map((sucursal) => (
                      <tr key={sucursal.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{sucursal.id}</td>
                        <td className="py-2 px-4">{sucursal.title}</td>
                        <td className="py-2 px-4 text-center">
                          <button
                            onClick={() => handleEditSucursal(sucursal.id, sucursal.title)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mr-2 text-sm transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSucursal(sucursal.id, sucursal.title)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-500">
                        No hay sucursales registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Historial de Pedidos Section */}
        {adminMode === 'historial' && (
          <>
            {selectedPedido ? (
              <div>
                <button
                  onClick={() => setSelectedPedido(null)}
                  className="mb-4 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                >
                  ← Volver al listado
                </button>
                
                <div className="flex flex-col items-center mb-6">
                  <img src={logoLaFe} alt="Logo La Fe" className="w-24 mb-2" />
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg mb-5 shadow-sm">
                  <div className="flex justify-between py-2.5 border-b border-gray-100">
                    <span className="font-bold text-[#2c3e50]">Fecha de entrega:</span>
                    <span className="text-[#34495e]">{formatDate(selectedPedido.fecha_entrega)}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-100">
                    <span className="font-bold text-[#2c3e50]">
                      {selectedPedido.cliente_personalizado ? 'Cliente:' : 'Sucursal:'}
                    </span>
                    <span className="text-[#34495e]">{selectedPedido.cliente_personalizado || selectedPedido.sucursal}</span>
                  </div>
                </div>
                
                <div>
                  <table className="w-full border-collapse mt-5 shadow-sm rounded-lg overflow-hidden">
                    <thead>
                      <tr>
                        <th className="bg-[#3498db] text-white py-3 px-4 text-center">Producto</th>
                        <th className="bg-[#3498db] text-white py-3 px-4 text-center">Cantidad</th>
                        <th className="bg-[#3498db] text-white py-3 px-4 text-center">Kgs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRODUCT_CATEGORIES.map((category) => {
                        const productos = selectedPedido.productos[category.name] || [];
                        if (productos.length === 0) return null;
                        
                        const sortedProducts = sortProductsByID(productos);
                        const total = sortedProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                        const isHeladosCategory = category.name === 'helados';
                        
                        return [
                          <tr key={`${category.name}-header`} className="bg-[#2980b9]">
                            <td colSpan="3" className="py-2 px-4 border-b border-gray-300 font-bold text-white text-center">{category.displayName}</td>
                          </tr>,
                          ...sortedProducts.map((item, index) => (
                            <tr key={`${category.name}-${item.id}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="py-3 px-4 border-b border-gray-200">{item.title}</td>
                              <td className="py-3 px-4 border-b border-gray-200 text-center">{item.quantity}</td>
                              <td className="py-3 px-4 border-b border-gray-200"></td>
                            </tr>
                          )),
                          isHeladosCategory && sortedProducts.length > 0 ? (
                            <tr key={`${category.name}-total`} className="bg-gray-200 font-bold">
                              <td className="py-2 px-4 border-t border-gray-400 text-right">Total</td>
                              <td className="py-2 px-4 border-t border-gray-400 text-center">{total}</td>
                              <td className="py-2 px-4 border-t border-gray-400"></td>
                            </tr>
                          ) : null
                        ];
                      }).flat()}
                    </tbody>
                  </table>
                  
                  {selectedPedido.observaciones && selectedPedido.observaciones.trim() !== '' && (
                    <div className="mt-6 text-right">
                      <div className="font-bold text-[#2c3e50]">Observaciones:</div>
                      <div className="text-[#34495e] whitespace-pre-line">{selectedPedido.observaciones}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => generarPDFPedido(selectedPedido)}
                    className="bg-red-500 hover:bg-red-600 text-white py-3 px-5 rounded font-bold transition-colors"
                  >
                    📥 Descargar PDF
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Sección para eliminar por rango de fechas */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-yellow-900 mb-3">Eliminar pedidos por rango de fechas</h3>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={deletePedidosByDateRange}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors font-medium"
                    >
                      🗑️ Eliminar en rango
                    </button>
                  </div>
                </div>
                
                {pedidos.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th 
                              className="py-3 px-4 text-left border-b cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleSort('id')}
                            >
                              ID Pedido{getSortIndicator('id')}
                            </th>
                            <th 
                              className="py-3 px-4 text-left border-b cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleSort('fecha_creacion')}
                            >
                              Fecha{getSortIndicator('fecha_creacion')}
                            </th>
                            <th 
                              className="py-3 px-4 text-left border-b cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleSort('cliente')}
                            >
                              Cliente/Sucursal{getSortIndicator('cliente')}
                            </th>
                            <th 
                              className="py-3 px-4 text-center border-b cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleSort('items')}
                            >
                              Items{getSortIndicator('items')}
                            </th>
                            <th className="py-3 px-4 text-center border-b">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedAndPaginatedPedidos().map((pedido) => {
                            const totalItems = Object.values(pedido.productos).reduce((sum, products) => {
                              return sum + (products ? products.reduce((s, p) => s + p.quantity, 0) : 0);
                            }, 0);
                            
                            return (
                              <tr key={pedido.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">#{pedido.id}</td>
                                <td className="py-3 px-4">{formatDateTimeArgentina(pedido.fecha_creacion || pedido.createdat)}</td>
                                <td className="py-3 px-4">{pedido.cliente_personalizado || pedido.sucursal}</td>
                                <td className="py-3 px-4 text-center">{totalItems}</td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => setSelectedPedido(pedido)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors"
                                  >
                                    Ver Detalles
                                  </button>
                                  <button
                                    onClick={() => generarPDFPedido(pedido)}
                                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm transition-colors ml-2"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => deletePedido(pedido.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm transition-colors ml-2"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, pedidos.length)}</span> de <span className="font-bold">{pedidos.length}</span> pedidos
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
                        >
                          ← Anterior
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                          disabled={currentPage === getTotalPages()}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No hay pedidos registrados
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;