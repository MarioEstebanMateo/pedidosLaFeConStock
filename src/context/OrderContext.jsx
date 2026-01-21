import { createContext, useState, useContext, useCallback } from 'react'

// Product categories configuration for consistent handling
const PRODUCT_CATEGORIES = [
  'helados', 'palitos', 'postres', 'crocker', 'dieteticos', 
  'buffet', 'softs', 'dulces', 'paletas', 'bites', 'termicos', 'barritas'
]

const OrderContext = createContext()

export const OrderProvider = ({ children }) => {
  const [orderData, setOrderData] = useState(() => {
    // Try to load from sessionStorage first
    const savedData = sessionStorage.getItem('orderData')
    if (savedData) {
      try {
        return JSON.parse(savedData)
      } catch (error) {
        console.error('Error parsing saved order data:', error)
      }
    }
    
    // Initialize state with a single structure if no saved data
    const initialState = {
      orderDate: new Date().toISOString().split('T')[0],
      sucursalId: '',
      sucursalTitle: '',
      isCustomClient: false,
      customClientName: '',
      observaciones: '',
      products: {}
    }
    
    // Initialize quantities and empty product arrays for each category
    PRODUCT_CATEGORIES.forEach(category => {
      initialState[`${category}Quantities`] = {}
      initialState[`${category}StockActual`] = {}
      initialState.products[category] = []
    })
    
    return initialState
  })

  // Update order data with memoized callback and save to sessionStorage
  const updateOrderData = useCallback((newData) => {
    setOrderData(prev => {
      const updated = {
        ...prev,
        ...newData
      }
      // Save to sessionStorage
      sessionStorage.setItem('orderData', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <OrderContext.Provider value={{ orderData, updateOrderData }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrderContext = () => useContext(OrderContext)