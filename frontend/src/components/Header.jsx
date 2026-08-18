import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/fund.png'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky-top">
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light py-3">
          <div className="container-fluid">
            <Link to="/" className="navbar-brand d-flex align-items-center">
              <img src={logo} alt="Fundación Prosperidad" height="50" className="me-3" />
              <span className="h5 mb-0 fw-bold d-none d-md-block" style={{color: '#800020'}}>Fundación Prosperidad A.C.</span>
              <span className="h5 mb-0 fw-bold d-md-none" style={{color: '#800020'}}>F. Prosperidad A.C.</span>
            </Link>
            
            <button 
              className="navbar-toggler" 
              type="button" 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                <li className="nav-item">
                  <Link to="/" className="nav-link fw-semibold" style={{color: '#800020'}} onClick={() => setIsOpen(false)}>Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link to="/nosotros" className="nav-link fw-semibold" style={{color: '#800020'}} onClick={() => setIsOpen(false)}>Nosotros</Link>
                </li>
                
                <li className="nav-item">
                  <a 
                    href="https://wa.me/+525525341060"
                    className="nav-link fw-semibold" 
                    style={{color: '#800020'}}
                    onClick={() => setIsOpen(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contacto vía WhatsApp
                  </a>
                </li>
                <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                  <Link 
                    to="/login" 
                    className="btn px-4 fw-semibold"
                    style={{backgroundColor: '#800020', color: 'white'}}
                    onClick={() => setIsOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header