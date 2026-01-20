import iconWhatsapp from '../assets/img/iconWhatsapp.png';

const WhatsappHelp = () => {
  return (
    <div className="text-center mt-5 mb-2">
      <p className="text-sm md:text-base text-gray-600">
        ¿Necesitas ayuda? Contactanos por WhatsApp
        <a 
          href="https://wa.me/5492477488532" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#25D366] hover:underline"
        >
          <img src={iconWhatsapp} alt="WhatsApp Icon" className="inline-block w-10 h-10 ml-1" />
        </a>
      </p>
    </div>
  );
};

export default WhatsappHelp;