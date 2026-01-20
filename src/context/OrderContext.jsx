import { createContext, useState, useContext, useCallback } from 'react'

// Product categories configuration for consistent handling
const PRODUCT_CATEGORIES = [
  'helados', 'palitos', 'postres', 'crocker', 'dieteticos', 
  'buffet', 'softs', 'dulces', 'paletas', 'bites', 'termicos', 'barritas'
]

const OrderContext = createContext()

export const OrderProvider = ({ children }) => {
  const [orderData, setOrderData] = useState(() => {
    // Initialize state with a single structure
    const initialState = {
      orderDate: new Date().toISOString().split('T')[0],
      sucursalId: '',
      sucursalTitle: '',
      isCustomClient: false,
      customClientName: '',
      observaciones: '', // <-- Add this line
      products: {}
    }
    
    // Initialize quantities and empty product arrays for each category
    PRODUCT_CATEGORIES.forEach(category => {
      initialState[`${category}Quantities`] = {}
      initialState.products[category] = []
    })
    
    return initialState
  })

  // Update order data with memoized callback
  const updateOrderData = useCallback((newData) => {
    setOrderData(prev => ({
      ...prev,
      ...newData
    }))
  }, [])

  return (
    <OrderContext.Provider value={{ orderData, updateOrderData }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrderContext = () => useContext(OrderContext)