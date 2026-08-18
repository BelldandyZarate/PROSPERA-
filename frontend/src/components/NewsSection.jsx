import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Focus from "../assets/Focus.jpeg"
import Banco from "../assets/Banco.jpeg"
import Rifa from "../assets/Rifa.jpeg"

const NewsSection = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const newsData = [
    {
      id: 1,
      title: "Focus group",
      date: "09 Ene 2025",
      category: "Focus",
      image: Focus,
      shortText: "En Fundación Prosperidad, hemos identificado a través de la experiencia  y evidencia acumulada que los servicios generan un impacto positivo...",
      fullText: "En Fundación Prosperidad, hemos identificado a través de la experiencia  y evidencia acumulada que los servicios generan un impacto positivo en el bienestar integral de las personas y sus familias. Con base en esta evidencia, se plantea la realización de un focus group como una herramienta estratégica para profundizar en la persepción de quienes han sido parte de nuestras actividades."
    },
    {
      id: 2,
      title: "Alianza con Banco de Alimentos",
      date: "30 Jun 2025",
      category: "Alianza",
      image: Banco,
      shortText: "Fundación Prosperidad establece una alianza estratégica con el Banco de Alimentos...",
      fullText: "Fundación Prosperidad establece una alianza estratégica con el Banco de Alimentos para fortalecer la atención integral a personas en situación de vunerabilidad, complementando el acompañamiento psicológico y nutricional con el acceso a alimentos basicos que contribuyan a una mejora real en su salud física y emocional."
    },
    {
      id: 3,
      title: "Rifa para miembros afiliados",
      date: "26 Jul 2025",
      category: "Evento",
      image: Rifa,
      shortText: "Como parte de nuestro compromiso con el bienestar integral y la participación activa de nuestra comunidad...",
      fullText: "Como parte de nuestro compromiso con el bienestar integral y la participación activa de nuestra comunidad, Fundación Prosperidad implementa un sistema de Rifas periódicas exclusivas para sus miembros afiliados. Esta iniciativa busca reconocer su confianza, fortalecer el sentido de pertenencia y generar espacios de incentivo que complementen el acompañamiento que brindamos."
    }

  ];

  // Rotación automática cada 6 segundos
  useEffect(() => {
    let interval;
    if (autoRotate && newsData.length > 2) {
      interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % newsData.length);
        setExpandedCards({});
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [autoRotate, newsData.length]);

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % newsData.length);
    setExpandedCards({});
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + newsData.length) % newsData.length);
    setExpandedCards({});
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 10000);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setExpandedCards({});
    setAutoRotate(false);
    setTimeout(() => setAutoRotate(true), 10000);
  };

  // Obtener las 2 tarjetas visibles actuales
  const getVisibleCards = () => {
    const cards = [];
    for (let i = 0; i < 2; i++) {
      const index = (currentIndex + i) % newsData.length;
      cards.push(newsData[index]);
    }
    return cards;
  };

  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="row justify-content-center mb-5">
          <div className="col-12 col-md-10 col-lg-8 text-center">
            <h2 className="section-title" style={{color: '#800000'}}>Últimas Noticias</h2>
            <p className="lead">Mantente informado sobre nuestras actividades y logros</p>
          </div>
        </div>

        <div className="position-relative">
          {/* Flecha izquierda - solo visible cuando hay más de 2 noticias */}
          {newsData.length > 2 && (
            <button 
              onClick={prevSlide}
              className="position-absolute start-0 top-50 translate-middle-y btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                zIndex: 10,
                border: '2px solid #800000'
              }}
              aria-label="Noticia anterior"
            >
              <FaChevronLeft style={{color: '#800000'}} />
            </button>
          )}

          {/* Contenedor de las tarjetas */}
          <div className="row g-4 justify-content-center">
            {getVisibleCards().map((item) => (
              <div 
                key={item.id}
                className="col-12 col-md-6"
              >
                <div 
                  className={`news-card bg-white rounded shadow-sm overflow-hidden h-100 mx-auto ${expandedCards[item.id] ? 'expanded' : ''}`}
                  style={{
                    maxWidth: '500px',
                    transition: 'all 0.3s ease',
                    transform: expandedCards[item.id] ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: expandedCards[item.id] ? '0 10px 20px rgba(0,0,0,0.15)' : '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="news-img w-100"
                    style={{height: '200px', objectFit: 'cover'}}
                  />
                  <div className="p-4">
                    <h3 className="h5" style={{color: '#800000'}}>{item.title}</h3>
                    <p className="small mb-3 d-flex align-items-center">
                      <span className="news-date px-2 py-1 rounded me-2 fw-bold" style={{backgroundColor: '#D4AF37', color: 'white'}}>
                        {item.date}
                      </span>
                      {item.category}
                    </p>
                    <p style={{minHeight: '60px'}}>
                      {expandedCards[item.id] ? item.fullText : item.shortText}
                    </p>
                    <button 
                      onClick={() => toggleCard(item.id)}
                      className="fw-bold text-decoration-none d-inline-flex align-items-center bg-transparent border-0 p-0" 
                      style={{color: '#800000', cursor: 'pointer'}}
                    >
                      {expandedCards[item.id] ? 'Leer menos' : 'Leer más'} 
                      <i className={`bi bi-arrow-${expandedCards[item.id] ? 'up' : 'right'} ms-2`}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flecha derecha - solo visible cuando hay más de 2 noticias */}
          {newsData.length > 2 && (
            <button 
              onClick={nextSlide}
              className="position-absolute end-0 top-50 translate-middle-y btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                zIndex: 10,
                border: '2px solid #800000'
              }}
              aria-label="Noticia siguiente"
            >
              <FaChevronRight style={{color: '#800000'}} />
            </button>
          )}
        </div>

        {/* Indicadores del carrusel - solo visible cuando hay más de 2 noticias */}
        {newsData.length > 2 && (
          <div className="d-flex justify-content-center mt-4">
            {newsData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`mx-1 rounded-circle p-2 ${currentIndex === index ? 'bg-maroon' : 'bg-secondary'}`}
                style={{
                  width: '12px',
                  height: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                aria-label={`Ir a noticia ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Estilos adicionales */}
      <style jsx>{`
        .news-card.expanded {
          z-index: 5;
        }
        .news-card:hover {
          transform: translateY(-5px) scale(1.01);
          transition: all 0.3s ease;
        }
        .bg-maroon {
          background-color: #800000;
        }
      `}</style>
    </section>
  );
};

export default NewsSection;