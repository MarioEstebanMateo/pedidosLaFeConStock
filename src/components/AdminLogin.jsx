import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../db/SupabaseClient';
import Swal from 'sweetalert2';
import logoLaFe from '../assets/img/logo-lafe.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor ingrese usuario y contraseña'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Authenticate against admin table
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (error || !data) {
        Swal.fire({
          icon: 'error',
          title: 'Error de acceso',
          text: 'Usuario o contraseña incorrectos'
        });
        setIsLoading(false);
        return;
      }
      
      // Store the authenticated session
      localStorage.setItem('adminSession', JSON.stringify({ 
        username,
        timestamp: new Date().toISOString()
      }));
      
      Swal.fire({
        icon: 'success',
        title: 'Acceso concedido',
        text: '¡Bienvenido al panel administrativo!',
        showConfirmButton: false,
        timer: 1500
      });
      
      // Redirect to admin panel
      setTimeout(() => {
        navigate('/lafeadmin');
      }, 1500);
      
    } catch (error) {
      console.error('Authentication error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema durante la autenticación'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img className="mx-auto h-24 w-auto" src={logoLaFe} alt="Logo La Fe" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso Administrativo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingrese sus credenciales para acceder
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button 
                type="button"
                onClick={() => navigate('/')} 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Volver al inicio
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;