import { useNavigate } from 'react-router-dom'
import logoLaFe from '../assets/img/logo-lafe.png'

const Tutorial = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#315988] to-[#052c4e] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src={logoLaFe} 
            alt="Logo La Fe" 
            className="h-16 md:h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-[#2c3e50] mb-2">
            Tutorial de Uso
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Guía paso a paso para realizar pedidos
          </p>
        </div>

        {/* Tutorial Steps */}
        <div className="space-y-6">
          {/* Paso 1 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              1. Seleccionar Sucursal
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              En la pantalla principal, selecciona la sucursal para la cual deseas realizar el pedido (Centro o CABA).
            </p>
            <p className="text-gray-600 text-xs md:text-sm italic">
              Nota: La fecha del pedido se establece automáticamente en el día actual, pero puedes modificarla si es necesario.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              2. Ingresar Stock Actual
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              Para cada producto visible en las diferentes categorías (Helados, Palitos, Postres, etc.), ingresa el stock actual que tienes en tu local:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1 ml-2">
              <li>Usa los botones <span className="font-bold">+</span> y <span className="font-bold">-</span> para ajustar las cantidades</li>
              <li>Para Postres y Térmicos, puedes escribir directamente la cantidad en el campo de entrada</li>
              <li>El sistema calculará automáticamente la cantidad a pedir según el stock mínimo requerido</li>
            </ul>
          </div>

          {/* Paso 3 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              3. Ordenar Alfabéticamente (Opcional)
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              Si deseas organizar mejor los productos, puedes activar el orden alfabético en cada categoría usando el checkbox que aparece al inicio de cada sección.
            </p>
          </div>

          {/* Paso 4 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              4. Agregar Observaciones (Solo Centro)
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              Si seleccionaste la sucursal Centro, verás un campo de observaciones donde puedes agregar notas adicionales sobre el pedido.
            </p>
          </div>

          {/* Paso 5 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              5. Revisar Pedido
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              Una vez que hayas ingresado todos los datos, presiona el botón <span className="font-bold">"Revisar Pedido"</span>. Esto te llevará a una pantalla de resumen donde podrás:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1 ml-2">
              <li>Ver todos los productos que serán pedidos (aquellos con cantidad mayor a 0)</li>
              <li>Revisar las cantidades y el stock actual de cada producto</li>
              <li>Modificar cualquier dato si es necesario</li>
            </ul>
          </div>

          {/* Paso 6 */}
          <div className="border-l-4 border-[#315988] pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2c3e50] mb-3">
              6. Enviar Pedido por WhatsApp
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-2">
              En la pantalla de revisión, encontrarás un botón para <span className="font-bold">"Enviar Pedido por WhatsApp"</span>. Al presionarlo:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm md:text-base space-y-1 ml-2">
              <li>Se abrirá WhatsApp con el pedido formateado y listo para enviar</li>
              <li>El mensaje incluirá la fecha, sucursal, y el detalle completo del pedido</li>
              <li>Solo debes confirmar el envío en WhatsApp</li>
            </ul>
          </div>

          {/* Tips Adicionales */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-[#2c3e50] mb-3">
              💡 Consejos Útiles
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm md:text-base">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>El stock mínimo está predefinido para cada producto y se actualiza desde el panel administrativo</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Solo se incluirán en el pedido los productos con cantidad mayor a 0</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Puedes volver a la pantalla anterior en cualquier momento para modificar el pedido</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Si necesitas ayuda durante el proceso, usa el botón de WhatsApp que aparece en la parte inferior de la pantalla principal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Botón para volver al Home */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className="bg-[#315988] text-white px-8 py-3 text-base md:text-lg rounded font-bold hover:bg-[#052c4e] transition-colors w-full max-w-[300px]"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export default Tutorial
