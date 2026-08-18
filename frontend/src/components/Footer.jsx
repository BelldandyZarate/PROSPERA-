import React from 'react'
import logo from '../assets/fund.png'

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--maroon)',
      color: 'var(--white)',
      padding: '3rem 2rem',
      borderTop: '3px solid var(--gold)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        textAlign: 'left'
      }}>
        {/* Columna 1 - Logo y descripción */}
        <div>
          <img 
            src={logo} 
            alt="Fundación Prosperidad" 
            style={{ 
              height: '60px', 
              marginBottom: '1rem',
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <h3 style={{ 
            color: 'var(--gold)',
            marginBottom: '1rem',
            fontSize: '1.25rem'
          }}>Fundación Prosperidad</h3>
        </div>

        {/* Columna 2 - Contacto */}
        <div>
          <h4 style={{ 
            color: 'var(--gold)',
            marginBottom: '1rem',
            fontSize: '1.1rem'
          }}>Contacto</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <i className="bi bi-geo-alt-fill" style={{ marginTop: '3px' }}></i>
              <span>Av. Rancho Sierra Hermosa Mz.17, Lt.15, Primer Piso, Tecámac, Estado de Mexico, C.P.55749</span>
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-telephone-fill"></i>
              <a href="tel:+525525341060" style={{ color: 'var(--white)', textDecoration: 'none' }}>
                +52 55 2534 1060
              </a>
            </p>
          </div>
        </div>

        {/* Columna 3 - Horario y enlaces rápidos */}
        <div>
          <h4 style={{ 
            color: 'var(--gold)',
            marginBottom: '1rem',
            fontSize: '1.1rem'
          }}>Horario</h4>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Lunes a Viernes:</strong><br />
            9:00 am - 5:00 pm
          </p>
          
        </div>

        {/* Columna 4 - Redes sociales */}
        <div>
          <h4 style={{ 
            color: 'var(--gold)',
            marginBottom: '1rem',
            fontSize: '1.1rem'
          }}>Síguenos</h4>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            fontSize: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <a href="https://www.facebook.com/people/Fundación-Prosperidad/61566498639640" style={{ color: 'var(--white)' }} aria-label="Facebook">
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#" style={{ color: 'var(--white)' }} aria-label="Twitter">
              <i className="bi bi-twitter-x"></i>
            </a>
            <a href="#" style={{ color: 'var(--white)' }} aria-label="Instagram">
              <i className="bi bi-instagram"></i>
            </a>
            <a href="https://wa.me/+525525341060" style={{ color: 'var(--white)' }} aria-label="Instagram">
              <i className="bi bi-whatsapp"></i>
            </a>
            
          </div>
          
          
        </div>
      </div>

      {/* Derechos reservados - Fila completa abajo */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '2rem auto 0',
        borderTop: '1px solid var(--gold)',
        paddingTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem'
      }}>
        <p>© {new Date().getFullYear()} Fundación Prosperidad A.C. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer