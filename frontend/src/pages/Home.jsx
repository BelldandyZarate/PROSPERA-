import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NewsSection from '../components/NewsSection'

const Home = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      <main className="flex-grow-1">
        {/* Hero Section */}
        <section className="hero-section text-white">
          <div className="hero-overlay"></div>
          <div className="container position-relative z-2 py-5">
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h1 className="display-4 fw-bold mb-4 text-shadow animate__animated animate__fadeInDown">
                  Impulso que transforma vidas.
                </h1>
                <p className="lead mb-5 animate__animated animate__fadeIn animate__delay-1s">
                  En Fundación Prosperidad trabajamos para crear oportunidades y mejorar la calidad 
                  de vida de las comunidades más necesitadas.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap animate__animated animate__fadeIn animate__delay-2s">
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="section-title" style={{color: '#800000'}}>Nuestra Misión</h2>
                <p className="lead mb-0">
                  En Fundación Prosperidad A.C., nuestra misión es <strong>impulsar el bienestar integral de las familias más vunerables</strong>, brindandoles acceso a recursos, servicios y acompañamiento que les permita mejorar su calidad de vida.
                  <br></br>
                  Trabajamos  con compromiso social y empatía, enfocándonos en cubrir  necesidades básicas, fortalecer el desarrollo personal y familiar, y fomentar comunidades más solidarias, saludables y autosuficientes.
                </p>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="program-card p-4 bg-white rounded shadow-sm text-center h-100">
                  <div className="program-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                    <i className="bi bi-basket2-fill fs-2" style={{color: '#800000'}}></i>
                  </div>
                  <h3 className="h5" style={{color: '#800000'}}>Productos de Primera Necesidad</h3>
                  <p>
                    Articulos básicos para el hogar a precios accesibles.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <div className="program-card p-4 bg-white rounded shadow-sm text-center h-100">
                  <div className="program-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                    <i className="bi bi-people-fill fs-2" style={{color: '#800000'}}></i>
                  </div>
                  <h3 className="h5" style={{color: '#800000'}}>Atención psicologica</h3>
                  <p>
                    Apoyo emocional y terapias individuales o familiares para fortalevcer la salud mental.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <div className="program-card p-4 bg-white rounded shadow-sm text-center h-100">
                  <div className="program-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                    <i className="bi bi-egg-fried fs-2" style={{color: '#800000'}}></i>
                  </div>
                  <h3 className="h5" style={{color: '#800000'}}>Nutriologia</h3>
                  <p>
                    Asesoria con nutriólogo profesional para mejorar la alimentación y el estilo de vida.
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <div className="program-card p-4 bg-white rounded shadow-sm text-center h-100">
                  <div className="program-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                    <i className="bi bi-journal-bookmark-fill fs-2" style={{color: '#800000'}}></i>
                  </div>
                  <h3 className="h5" style={{color: '#800000'}}>Asesoría Jurídica</h3>
                  <p>
                    Orientación legal en temas familiares, civiles y sociales, pensada para quienes más lo necesitan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-5 bg-light-gold">
          <div className="container">
            <div className="row g-4 text-center">
              <div className="col-6 col-md-3">
                <div className="p-3">
                  <h3 className="display-5 fw-bold" style={{color: '#800000'}}>1+</h3>
                  <p className="mb-0 fw-semibold" style={{color: '#800000'}}>Años de experiencia</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3">
                  <h3 className="display-5 fw-bold" style={{color: '#800000'}}>4+</h3>
                  <p className="mb-0 fw-semibold" style={{color: '#800000'}}>Programas activos</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3">
                  <h3 className="display-5 fw-bold" style={{color: '#800000'}}>200+</h3>
                  <p className="mb-0 fw-semibold" style={{color: '#800000'}}>Beneficiarios</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3">
                  <h3 className="display-5 fw-bold" style={{color: '#800000'}}>2+</h3>
                  <p className="mb-0 fw-semibold" style={{color: '#800000'}}>Comunidades</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
              </div>
            </div>
            <NewsSection></NewsSection>
          </div>
        </section>
        
      </main>
      
      <Footer />
    </div>
  )
}

export default Home