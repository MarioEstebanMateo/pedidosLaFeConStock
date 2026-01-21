import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { testSupabaseConnection } from '../db/testSupabase'
import supabase from '../db/SupabaseClient'
import { useOrderContext } from '../context/OrderContext'
import Swal from 'sweetalert2'
import logoLaFe from '../assets/img/logo-lafe.png'
import WhatsappHelp from './WhatsappHelp'

// Define all product categories for consistent management
// Base names without suffix - suffix will be determined by selected sucursal
const PRODUCT_CATEGORIES = [
  { name: 'helados', displayName: 'Helados' },
  { name: 'palitos', displayName: 'Palitos' },
  { name: 'postres', displayName: 'Postres' },
  { name: 'crocker', displayName: 'Crocker' },
  { name: 'dieteticos', displayName: 'Dietéticos' },
  { name: 'buffet', displayName: 'Buffet' },
  { name: 'softs', displayName: 'Softs' },
  { name: 'dulces', displayName: 'Dulces' },
  { name: 'paletas', displayName: 'Paletas' },
  { name: 'bites', displayName: 'Bites' },
  { name: 'barritas', displayName: 'Barritas' },
  { name: 'termicos', displayName: 'Térmicos' }
]

// Map sucursal titles to table suffixes
const SUCURSAL_TABLE_SUFFIX = {
  'Centro': '_centro',
  'CABA': '_caba'
}

const Home = () => {
  const navigate = useNavigate()
  const { orderData, updateOrderData } = useOrderContext()
  
  const [sucursales, setSucursales] = useState([])
  const [selectedSucursal, setSelectedSucursal] = useState(orderData.sucursalId || '')
  const [orderDate, setOrderDate] = useState(orderData.orderDate || new Date().toISOString().split('T')[0])
  
  // State for current table suffix based on selected sucursal
  const [tableSuffix, setTableSuffix] = useState('')
  
  // Unified state management for all products and stock quantities
  const [products, setProducts] = useState({})
  const [stockActual, setStockActual] = useState({}) // Stock actual que ingresa el cliente
  const [observaciones, setObservaciones] = useState(orderData.observaciones || '')
  
  // State for sorting products alphabetically - initialize from context
  const [sortAlphabetically, setSortAlphabetically] = useState(orderData.sortAlphabetically || {})

  useEffect(() => {
    testSupabaseConnection().then(isConnected => {
      if (isConnected) {
        console.log('Supabase is working correctly!')
      } else {
        console.log('There was an issue with the Supabase connection')
      }
    })

    const fetchSucursales = async () => {
      try {
        // Fetch sucursales
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('*')
          
        if (sucursalesError) throw sucursalesError
        setSucursales(sucursalesData)
      } catch (error) {
        console.error('Error fetching sucursales:', error)
      }
    }

    fetchSucursales()
  }, [])
  
  // Load products when sucursal is selected and table suffix is determined
  useEffect(() => {
    if (!tableSuffix) return
    
    const fetchProducts = async () => {
      try {
        // Fetch all product categories in parallel with the suffix
        const productPromises = PRODUCT_CATEGORIES.map(category => 
          supabase.from(category.name + tableSuffix).select('id, title, stock_min')
        )
        
        const productResults = await Promise.all(productPromises)
        
        // Process results into a unified structure
        const newProducts = {}
        const newStockActual = {}
        
        productResults.forEach((result, index) => {
          const categoryName = PRODUCT_CATEGORIES[index].name
          
          if (result.error) {
            console.error(`Error fetching ${categoryName}${tableSuffix}:`, result.error)
            return
          }
          
          newProducts[categoryName] = result.data.sort((a, b) => a.id - b.id)
          
          // Initialize stock actual from context if available, otherwise set to 0
          if (!newStockActual[categoryName]) newStockActual[categoryName] = {}
          
          const contextStockActual = orderData[`${categoryName}StockActual`] || {}
          
          result.data.forEach(item => {
            newStockActual[categoryName][item.id] = contextStockActual[item.id] || 0
          })
        })
        
        setProducts(newProducts)
        setStockActual(newStockActual)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    
    fetchProducts()
  }, [tableSuffix])

  // Generic handler for stock actual changes
  const handleStockActualChange = (category, id, increment) => {
    setStockActual(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [id]: Math.max(0, (prev[category]?.[id] || 0) + (increment ? 1 : -1))
      }
    }))
  }
  
  // Calculate order quantity for a product (stock_min - stock_actual)
  const calculateOrderQuantity = (category, productId) => {
    const product = products[category]?.find(p => p.id === productId)
    if (!product) return 0
    
    const stockMin = product.stock_min || 0
    const currentStock = stockActual[category]?.[productId] || 0
    const orderQty = stockMin - currentStock
    
    return Math.max(0, orderQty) // Never negative
  }
  
  // Handler to toggle alphabetical sorting for a category
  const toggleSortAlphabetically = (categoryName) => {
    setSortAlphabetically(prev => {
      const newState = {
        ...prev,
        [categoryName]: !prev[categoryName]
      }
      // Update context immediately
      updateOrderData({ sortAlphabetically: newState })
      return newState
    })
  }

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value
    setOrderDate(newDate)
    updateOrderData({ orderDate: newDate })
  }

  // Handle sucursal selection
  const handleSucursalChange = (e) => {
    const selectedId = e.target.value;
    const selectedSucursal = sucursales.find(s => s.id.toString() === selectedId);
    const selectedTitle = selectedSucursal?.title || '';
    
    setSelectedSucursal(selectedId);
    
    // Determine table suffix based on sucursal title
    const suffix = SUCURSAL_TABLE_SUFFIX[selectedTitle] || '';
    setTableSuffix(suffix);
    
    updateOrderData({ 
      sucursalId: selectedId,
      sucursalTitle: selectedTitle,
      tableSuffix: suffix
    });
    
    // Reset observaciones if not centro
    if (selectedTitle !== 'Centro') {
      setObservaciones('');
      updateOrderData({ observaciones: '' });
    }
    
    // Reset products and stock when changing sucursal
    setProducts({});
    setStockActual({});
  }

  // Handle observaciones change
  const handleObservacionesChange = (e) => {
    setObservaciones(e.target.value);
    updateOrderData({ observaciones: e.target.value });
  }

  // Handle the "Revisar Pedido" button click
  const handleReviewOrder = () => {
    // Validation: check if a sucursal is selected
    if (!selectedSucursal) {
      Swal.fire({
        title: 'Selecciona una sucursal',
        text: 'Por favor selecciona una sucursal antes de continuar',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3498db'
      })
      return
    }
    
    // Check if any products have calculated orders > 0
    const hasAnyOrders = PRODUCT_CATEGORIES.some(category => {
      const categoryProducts = products[category.name] || []
      return categoryProducts.some(product => calculateOrderQuantity(category.name, product.id) > 0)
    })
    
    if (!hasAnyOrders) {
      Swal.fire({
        title: 'No hay pedidos',
        text: 'Según el stock ingresado, no hay productos para pedir. Verifica el stock actual de tus productos.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3498db'
      })
      return
    }

    // Prepare data for context update
    const updateData = {
      orderDate,
      sortAlphabetically, // Pass sort preferences
      tableSuffix, // Include table suffix for reference
      // Map all stock actual by category
      ...PRODUCT_CATEGORIES.reduce((acc, category) => {
        acc[`${category.name}StockActual`] = stockActual[category.name] || {}
        return acc
      }, {}),
      // Prepare products with calculated order quantities (only those > 0)
      products: PRODUCT_CATEGORIES.reduce((acc, category) => {
        const categoryProducts = products[category.name] || []
        const categoryStockActual = stockActual[category.name] || {}
        
        acc[category.name] = categoryProducts
          .map(item => {
            const orderQty = calculateOrderQuantity(category.name, item.id)
            return orderQty > 0 ? { 
              id: item.id, 
              title: item.title, 
              quantity: orderQty,
              stock_actual: categoryStockActual[item.id] || 0,
              stock_min: item.stock_min || 0
            } : null
          })
          .filter(item => item !== null)
        
        return acc
      }, {})
    }
    
    updateOrderData(updateData)
    navigate('/review')
  }

  // Function to render a product category section
  const renderProductSection = (category) => {
    const categoryName = category.name
    const categoryProducts = products[categoryName]
    const categoryStockActual = stockActual[categoryName] || {}
    
    if (!categoryProducts || categoryProducts.length === 0) return null
    
    // Sort products based on the state
    const sortedProducts = [...categoryProducts]
    if (sortAlphabetically[categoryName]) {
      sortedProducts.sort((a, b) => a.title.localeCompare(b.title))
    }
    
    return (
      <div className="mb-6 text-center" key={categoryName}>
        <div className="flex flex-col items-center gap-2 mb-3">
          <h2 className="text-[#2c3e50] text-lg md:text-2xl pb-2 border-b-2 border-gray-100 text-center">
            {category.displayName}
          </h2>
          {categoryName === 'helados' && (
            <button
              onClick={() => toggleSortAlphabetically(categoryName)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                sortAlphabetically[categoryName]
                  ? 'bg-[#315988] text-white hover:bg-[#052c4e] hover:shadow-md'
                  : 'bg-white text-[#315988] border-2 border-[#315988] hover:bg-[#315988] hover:text-white'
              }`}
            >
              {sortAlphabetically[categoryName] ? '✓ Ordenado Alfabéticamente' : 'Ordenar Alfabéticamente'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-w-3xl mx-auto">
          {sortedProducts.map((product) => {
            const currentStock = categoryStockActual[product.id] || 0
            const orderQty = calculateOrderQuantity(categoryName, product.id)
            
            return (
              <div key={product.id} className="border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <div className="flex-grow flex items-center justify-center">
                  <h3 className="text-base font-bold mb-2.5 text-center">{product.title}</h3>
                </div>
                
                {/* Stock Actual Input */}
                <div className="mt-auto">
                  <label className="text-xs text-gray-600 block mb-1">Stock Actual:</label>
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => handleStockActualChange(categoryName, product.id, false)}
                      className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-base"
                      aria-label={`Disminuir stock de ${product.title}`}
                    >
                      -
                    </button>
                    <span className="mx-2 text-base font-bold w-8 text-center">
                      {currentStock}
                    </span>
                    <button 
                      onClick={() => handleStockActualChange(categoryName, product.id, true)}
                      className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base"
                      aria-label={`Aumentar stock de ${product.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2.5 font-sans box-border">
      <div className="flex flex-col items-center mb-5">
        <img src={logoLaFe} alt="Logo La Fe" className="w-30 mb-2" width="120" height="120" />
        <h1 className="text-xl md:text-3xl text-[#2c3e50] my-1 text-center">App Pedidos La Fe Con Stock</h1>
      </div>
      
      <div className="mb-6 text-center">
        <h2 className="text-[#2c3e50] text-lg md:text-2xl mb-3 pb-2 border-b-2 border-gray-100 text-center">
          Selecciona la Fecha del Pedido
        </h2>
        <div className="flex flex-col items-center w-full">
          <label className="block mb-1 text-sm md:text-base font-bold text-[#2c3e50] text-center" htmlFor="orderDate">
            Fecha de entrega:
          </label>
          <input
            type="date"
            id="orderDate"
            value={orderDate}
            onChange={handleDateChange}
            className="p-2.5 rounded border border-gray-300 w-auto min-w-[200px] max-w-full mb-5 text-base font-sans"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      
      <div className="mb-6 text-center">
        <h2 className="text-[#2c3e50] text-lg md:text-2xl mb-3 pb-2 border-b-2 border-gray-100 text-center">
          Selecciona la Sucursal
        </h2>
        <div className="flex flex-col items-center w-full">
          <label htmlFor="sucursalSelect" className="block mb-1 text-sm md:text-base font-bold text-[#2c3e50] text-center">
            Sucursal:
          </label>
          <select 
            id="sucursalSelect"
            className="p-2.5 rounded border border-gray-300 w-auto min-w-[200px] max-w-full mb-5 text-base"
            value={selectedSucursal}
            onChange={handleSucursalChange}
            aria-label="Seleccionar sucursal"
          >
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>{sucursal.title}</option>
            ))}
          </select>
          {/* Observaciones field for Sucursal Centro */}
          {sucursales.find(s => s.id.toString() === selectedSucursal && s.title === 'Centro') && (
            <div className="mb-5 w-full max-w-[400px] mx-auto">
              <label htmlFor="observaciones" className="block mb-1 text-sm md:text-base font-bold text-[#2c3e50] text-center">
                Observaciones:
              </label>
              <textarea
                id="observaciones"
                className="p-2.5 rounded border border-gray-300 w-full text-base font-sans"
                value={observaciones}
                onChange={handleObservacionesChange}
                placeholder="Ingrese observaciones para Centro"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Render product sections based on defined categories */}
      {PRODUCT_CATEGORIES.filter(category => {
        // Only show "termicos" when CABA is selected
        if (category.name === 'termicos') {
          const selectedSuc = sucursales.find(s => s.id.toString() === selectedSucursal);
          return selectedSuc?.title === 'CABA';
        }
        return true;
      }).map(category => renderProductSection(category))}
      
      <div className="mb-6 text-center">
        <button 
          onClick={handleReviewOrder}
          className={`bg-[#315988] text-white w-full max-w-[300px] py-3 text-lg rounded font-bold hover:bg-[#052c4e] transition-colors ${
            !selectedSucursal ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
          aria-disabled={!selectedSucursal}
        >
          Revisar Pedido
        </button>
      </div>
      
      {/* Replace the WhatsApp section with the new component */}
      <WhatsappHelp />

      <div className="text-center">
  <button 
    onClick={() => navigate('/admin-login')}
    className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
  >
    Acceso Administrativo
  </button>
</div>
    </div>
  )
}

export default Home