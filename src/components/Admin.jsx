import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../db/SupabaseClient';
import Swal from 'sweetalert2';
import logoLaFe from '../assets/img/logo-lafe.png';

// Product categories configuration matching the existing system
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
];

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(PRODUCT_CATEGORIES[0].name);
  const [products, setProducts] = useState([]);
  const [newProductTitle, setNewProductTitle] = useState('');
  
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
            .from('admin')
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
          loadProducts(currentCategory);
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
  
  // Load products when category changes (but only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts(currentCategory);
    }
  }, [currentCategory, isAuthenticated]);
  
  const loadProducts = async (category) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from(category)
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(`Error loading ${category}:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudieron cargar los ${PRODUCT_CATEGORIES.find(c => c.name === category).displayName}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
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
      
      const { data, error } = await supabase
        .from(currentCategory)
        .insert([{ title: newProductTitle.trim() }])
        .select();
      
      if (error) throw error;
      
      setProducts([...products, data[0]]);
      setNewProductTitle('');
      
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
        text: 'No se pudo agregar el producto'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditProduct = async (id, currentTitle) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Editar producto',
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
          .from(currentCategory)
          .update({ title: newTitle })
          .eq('id', id);
        
        if (error) throw error;
        
        setProducts(products.map(product => 
          product.id === id ? { ...product, title: newTitle } : product
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
          text: 'No se pudo actualizar el producto'
        });
      } finally {
        setIsLoading(false);
      }
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
        
        const { error } = await supabase
          .from(currentCategory)
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
      
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2c3e50]">
            Gestión de {PRODUCT_CATEGORIES.find(c => c.name === currentCategory).displayName}
          </h2>
          
          <button 
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
          >
            Cerrar Sesión
          </button>
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
        
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newProductTitle}
            onChange={(e) => setNewProductTitle(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded"
            placeholder={`Nuevo ${PRODUCT_CATEGORIES.find(c => c.name === currentCategory).displayName.slice(0, -1)}...`}
          />
          <button
            onClick={handleAddProduct}
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
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{product.id}</td>
                    <td className="py-2 px-4">{product.title}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleEditProduct(product.id, product.title)}
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
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">
                    No hay productos en esta categoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;