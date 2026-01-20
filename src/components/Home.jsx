import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { testSupabaseConnection } from '../db/testSupabase'
import supabase from '../db/SupabaseClient'
import { useOrderContext } from '../context/OrderContext'
import Swal from 'sweetalert2'
import logoLaFe from '../assets/img/logo-lafe.png'
import WhatsappHelp from './WhatsappHelp'

// Define all product categories for consistent management
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

const Home = () => {
  const navigate = useNavigate()
  const { orderData, updateOrderData } = useOrderContext()
  
  const [sucursales, setSucursales] = useState([])
  const [selectedSucursal, setSelectedSucursal] = useState(orderData.sucursalId || '')
  const [orderDate, setOrderDate] = useState(orderData.orderDate || new Date().toISOString().split('T')[0])
  
  // Add state for custom client
  const [customClientName, setCustomClientName] = useState(orderData.customClientName || '')
  const [showCustomClientField, setShowCustomClientField] = useState(
    orderData.sucursalId === 'custom' || false
  )
  
  // Unified state management for all products and quantities
  const [products, setProducts] = useState({})
  const [quantities, setQuantities] = useState({})
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

    const fetchData = async () => {
      try {
        // Fetch sucursales
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('*')
          
        if (sucursalesError) throw sucursalesError
        setSucursales(sucursalesData)

        // Fetch all product categories in parallel
        const productPromises = PRODUCT_CATEGORIES.map(category => 
          supabase.from(category.name).select('*')
        )
        
        const productResults = await Promise.all(productPromises)
        
        // Process results into a unified structure
        const newProducts = {}
        const newQuantities = {}
        
        productResults.forEach((result, index) => {
          const categoryName = PRODUCT_CATEGORIES[index].name
          
          if (result.error) {
            console.error(`Error fetching ${categoryName}:`, result.error)
            return
          }
          
          newProducts[categoryName] = result.data.sort((a, b) => a.id - b.id)
          
          // Initialize quantities from context if available, otherwise set to 0
          if (!newQuantities[categoryName]) newQuantities[categoryName] = {}
          
          const contextQuantities = orderData[`${categoryName}Quantities`] || {}
          
          result.data.forEach(item => {
            newQuantities[categoryName][item.id] = contextQuantities[item.id] || 0
          })
        })
        
        setProducts(newProducts)
        setQuantities(newQuantities)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Generic handler for quantity changes
  const handleQuantityChange = (category, id, increment) => {
    setQuantities(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [id]: Math.max(0, (prev[category]?.[id] || 0) + (increment ? 1 : -1))
      }
    }))
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
    if (selectedId === 'custom') {
      // For custom client selection
      setSelectedSucursal('custom')
      setShowCustomClientField(true)
      updateOrderData({ 
        sucursalId: 'custom',
        sucursalTitle: customClientName || 'Cliente Varios',
        isCustomClient: true
      })
    } else {
      const selectedTitle = sucursales.find(s => s.id.toString() === selectedId)?.title || '';
      setSelectedSucursal(selectedId);
      setShowCustomClientField(false);
      updateOrderData({ 
        sucursalId: selectedId,
        sucursalTitle: selectedTitle,
        isCustomClient: false,
        customClientName: ''
      });
      // Reset observaciones if not centro
      if (selectedTitle !== 'Centro') {
        setObservaciones('');
        updateOrderData({ observaciones: '' });
      }
    }
  }
  
  // Handle custom client name changes
  const handleCustomClientChange = (e) => {
    const name = e.target.value
    setCustomClientName(name)
    updateOrderData({
      customClientName: name,
      sucursalTitle: name || 'Cliente Varios'
    })
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
    
    // For custom client, validate that a name was entered
    if (selectedSucursal === 'custom' && !customClientName.trim()) {
      Swal.fire({
        title: 'Nombre de cliente requerido',
        text: 'Por favor ingresa el nombre del cliente',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3498db'
      })
      return
    }
    
    // Check if any products are selected
    const hasAnyProducts = PRODUCT_CATEGORIES.some(category => 
      Object.values(quantities[category.name] || {}).some(qty => qty > 0)
    )
    
    if (!hasAnyProducts) {
      Swal.fire({
        title: 'No hay productos',
        text: 'Por favor selecciona al menos un producto para tu pedido',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3498db'
      })
      return
    }

    // Prepare data for context update
    const updateData = {
      orderDate,
      customClientName: showCustomClientField ? customClientName : '',
      isCustomClient: showCustomClientField,
      sortAlphabetically, // Pass sort preferences
      // Map all quantities by category
      ...PRODUCT_CATEGORIES.reduce((acc, category) => {
        acc[`${category.name}Quantities`] = quantities[category.name] || {}
        return acc
      }, {}),
      // Prepare products by filtering those with quantity > 0
      products: PRODUCT_CATEGORIES.reduce((acc, category) => {
        const categoryProducts = products[category.name] || []
        const categoryQuantities = quantities[category.name] || {}
        
        acc[category.name] = categoryProducts
          .filter(item => categoryQuantities[item.id] > 0)
          .map(item => ({ 
            id: item.id, 
            title: item.title, 
            quantity: categoryQuantities[item.id] 
          }))
        
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
    const categoryQuantities = quantities[categoryName] || {}
    
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
            Selecciona los {category.displayName}
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
          {sortedProducts.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex-grow flex items-center justify-center">
                <h3 className="text-base font-bold mb-2.5 text-center">{product.title}</h3>
              </div>
              <div className="flex items-center justify-center mt-auto pt-2">
                <button 
                  onClick={() => handleQuantityChange(categoryName, product.id, false)}
                  className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center text-lg"
                  aria-label={`Disminuir cantidad de ${product.title}`}
                >
                  -
                </button>
                <span className="mx-3 text-lg font-bold w-6 text-center">
                  {categoryQuantities[product.id] || 0}
                </span>
                <button 
                  onClick={() => handleQuantityChange(categoryName, product.id, true)}
                  className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-lg"
                  aria-label={`Aumentar cantidad de ${product.title}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2.5 font-sans box-border">
      <div className="flex flex-col items-center mb-5">
        <img src={logoLaFe} alt="Logo La Fe" className="w-30 mb-2" width="120" height="120" />
        <h1 className="text-xl md:text-3xl text-[#2c3e50] my-1 text-center">App Pedidos La Fe</h1>
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
          Selecciona la Sucursal o Cliente
        </h2>
        <div className="flex flex-col items-center w-full">
          <label htmlFor="sucursalSelect" className="block mb-1 text-sm md:text-base font-bold text-[#2c3e50] text-center">
            Sucursal o Cliente:
          </label>
          <select 
            id="sucursalSelect"
            className="p-2.5 rounded border border-gray-300 w-auto min-w-[200px] max-w-full mb-5 text-base"
            value={selectedSucursal}
            onChange={handleSucursalChange}
            aria-label="Seleccionar sucursal o cliente"
          >
            <option value="">Selecciona una opción</option>
            {/* Add the custom client option at the top */}
            <option value="custom">Clientes Varios</option>
            {/* Separator for better visual grouping */}
            <option disabled>──────────</option>
            {/* Regular sucursales */}
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>{sucursal.title}</option>
            ))}
          </select>
          
          {/* Show custom client input field when 'Cliente Varios' is selected */}
          {showCustomClientField && (
            <div className="mb-5 w-full max-w-[300px]">
              <label htmlFor="customClient" className="block mb-1 text-sm md:text-base font-bold text-[#2c3e50] text-center">
                Nombre del Cliente:
              </label>
              <input
                id="customClient"
                type="text"
                className="p-2.5 rounded border border-gray-300 w-full text-base font-sans"
                value={customClientName}
                onChange={handleCustomClientChange}
                placeholder="Ingrese nombre del cliente"
              />
            </div>
          )}
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
      {PRODUCT_CATEGORIES.map(category => renderProductSection(category))}
      
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