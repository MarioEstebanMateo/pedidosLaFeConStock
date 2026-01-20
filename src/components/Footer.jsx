
const Footer = () => {
  return (
    <>
    <div>
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <p className="text-base">
                    &copy; {new Date().getFullYear()} - La Fe S.A. - Todos los derechos reservados.
                </p>
                <p className="text-base mt-2">
                    Diseñado y desarrollado por <a href="mailto:memateo@gmail.com" className="text-blue-400 hover:underline"> Mario E. Mateo
                    </a> para La Fe S.A.</p>
            </div>
        </footer>
    </div>
    </>
  )
}

export default Footer