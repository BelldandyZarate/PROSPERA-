import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Director from "../assets/474475289_575556255454597_8942368890307685869_n.jpg"

const About = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      <main className="flex-grow-1">
        {/* Hero Section con overlay reducido */}
        <section className="hero-section-about text-white position-relative">
          <div className="hero-overlay" style={{backgroundColor: 'rgba(0,0,0,0.3)'}}></div>
          <div className="container position-relative z-2 py-5">
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h1 className="display-5 fw-bold mb-4 text-shadow">Nuestra Historia</h1>
                <p className="lead">Conoce más sobre nuestra fundación y nuestro compromiso con las comunidades</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Organization Section */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="h3" style={{color: '#800000'}}>Somos Fundación Prosperidad</h2>
                <p className="lead">Organización sin fines de lucro comprometida con el desarrollo social</p>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="h-100 p-4 bg-light-gold rounded shadow-sm">
                  <h3 className="h4" style={{color: '#800000'}}>Nuestra Organización</h3>
                  <p>
                    En Fundación Prosperidad A.C., nuestra misión es <strong>impulsar el bienestar integral de las 
                    familias más vulnerables</strong>, brindándoles acceso a recursos, servicios y acompañamiento 
                    que les permitan mejorar su calidad de vida.
                  </p>
                  <p>
                    Trabajamos con compromiso social y empatía, enfocándonos en cubrir necesidades básicas, fortalecer 
                    el desarrollo personal y familiar, y fomentar comunidades más solidarias, saludables y autosuficientes.
                  </p>
                  <div className="row g-3 mt-4">
                    <div className="col-6">
                      <div className="p-3 bg-white rounded shadow-sm text-center">
                        <h4 className="display-6 fw-bold" style={{color: '#800000'}}>1+</h4>
                        <p className="mb-0 small text-muted">Años de experiencia</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-white rounded shadow-sm text-center">
                        <h4 className="display-6 fw-bold" style={{color: '#800000'}}>200+</h4>
                        <p className="mb-0 small text-muted">Beneficiarios</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="h-100 p-4 bg-light-gold rounded shadow-sm">
                  <h3 className="h4" style={{color: '#800000'}}>Lo Que Hacemos</h3>
                  <p>
                    Ofrecemos servicios y productos esenciales a bajos costos para apoyar la economía 
                    de las familias y mejorar su bienestar integral.
                  </p>
                  <p>
                    Entre nuestros principales servicios se encuentran:
                  </p>
                  
                  {/* Productos de primera necesidad */}
                  <div className="d-flex align-items-start mb-3">
                    <div className="rounded-circle p-2 me-3" style={{backgroundColor: '#800000', color: 'white'}}>
                      <i className="bi bi-basket2-fill fs-5"></i>
                    </div>
                    <div>
                      <h4 className="h6 mb-1" style={{color: '#800000'}}>Productos de Primera Necesidad</h4>
                      <p className="small text-muted mb-0">
                        Artículos básicos para el hogar a precios accesibles.
                      </p>
                    </div>
                  </div>
                  
                  {/* Atención Psicológica */}
                  <div className="d-flex align-items-start mb-3">
                    <div className="rounded-circle p-2 me-3" style={{backgroundColor: '#800000', color: 'white'}}>
                      <i className="bi bi-people-fill fs-5"></i>
                    </div>
                    <div>
                      <h4 className="h6 mb-1" style={{color: '#800000'}}>Atención Psicológica</h4>
                      <p className="small text-muted mb-0">
                        Apoyo emocional y terapias individuales o familiares para fortalecer la salud mental.
                      </p>
                    </div>
                  </div>
                  
                  {/* Nutriología */}
                  <div className="d-flex align-items-start mb-3">
                    <div className="rounded-circle p-2 me-3" style={{backgroundColor: '#800000', color: 'white'}}>
                      <i className="bi bi-egg-fried fs-5"></i>
                    </div>
                    <div>
                      <h4 className="h6 mb-1" style={{color: '#800000'}}>Nutriología</h4>
                      <p className="small text-muted mb-0">
                        Asesoría con nutriólogo profesional para mejorar la alimentación y el estilo de vida.
                      </p>
                    </div>
                  </div>

                  {/* Asesoría Jurídica */}
                  <div className="d-flex align-items-start mb-3">
                    <div className="rounded-circle p-2 me-3" style={{backgroundColor: '#800000', color: 'white'}}>
                      <i className="bi bi-journal-bookmark-fill fs-5"></i>
                    </div>
                    <div>
                      <h4 className="h6 mb-1" style={{color: '#800000'}}>Asesoría Jurídica</h4>
                      <p className="small text-muted mb-0">
                        Orientación legal en temas familiares, civiles y sociales, pensada para quienes más lo necesitan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Director's Message Section */}
        <section className="py-5 bg-light-gold">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-12 col-lg-4 text-center">
                <img 
                  src= {Director}
                  alt="Director General" 
                  className="img-fluid rounded-circle shadow mb-4"
                  style={{ width: '250px', height: '250px', objectFit: 'cover' }}
                />
                <h3 className="h4" style={{color: '#800000'}}>Lic. Adrián Perez Guerrero</h3>
                <p className="text-muted">Director General</p>
                <div className="d-flex justify-content-center gap-3">
                  <a href="https://www.facebook.com/p/Adrián-Perez-Guerrero-100090006818930" style={{color: '#800000'}}>
                    <i className="bi bi-facebook fs-5"></i>
                  </a>
                </div>
              </div>
              <div className="col-12 col-lg-8">
                <div className="bg-white p-4 p-lg-5 rounded shadow-sm">
                  <h2 className="h3 text-center" style={{color: '#800000'}}>Mensaje del Director</h2>
                  <div className="mb-4 text-center text-lg-start">
                    <i className="bi bi-quote fs-1 text-gold"></i>
                  </div>
                  <blockquote className="lead text-muted mb-4">
                    <p>"En <strong>Fundación Prosperidad A.C.</strong> creemos que <strong>todas las personas merecen oportunidades para mejorar su calidad de vida.</strong></p>
                    <p>Ofrecemos <strong>productos básicos a bajo costo</strong>, así como <strong>servicios accesibles de psicología, nutrición y asesoría jurídica, </strong>
                    con el propósito de apoyar el bienestar integral de las familias.</p>
                    <p>Nuestro compromiso es ser un puente de apoyo real para que más personas puedan avanzar y construir un futuro digno."</p>
                  </blockquote>
                  <p className="h6 text-center" style={{color: '#800000'}}>
                    - Lic. Adrian Perez Guerrero
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="h3" style={{color: '#800000'}}>Nuestros Valores</h2>
                <p className="lead">Principios que guían nuestro trabajo diario</p>
              </div>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: 'bi-heart-fill',
                  title: 'Solidaridad',
                  description: 'Actuamos con empatía y compromiso hacia quienes más lo necesitan.'
                },
                {
                  icon: 'bi-shield-fill-check',
                  title: 'Transparencia',
                  description: 'Manejamos nuestros recursos con honestidad y rendición de cuentas.'
                },
                {
                  icon: 'bi-people-fill',
                  title: 'Trabajo en equipo',
                  description: 'Creemos en la fuerza de la colaboración para lograr mayores impactos.'
                },
                {
                  icon: 'bi-lightbulb-fill',
                  title: 'Innovación',
                  description: 'Buscamos constantemente nuevas formas de resolver problemas sociales.'
                },
                {
                  icon: 'bi-bookmark-fill',
                  title: 'Compromiso',
                  description: 'Mantenemos nuestra palabra y cumplimos con lo prometido.'
                },
                {
                  icon: 'bi-tree-fill',
                  title: 'Sostenibilidad',
                  description: 'Nuestros programas están diseñados para perdurar en el tiempo.'
                }
              ].map((value, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="p-4 bg-light-gold rounded shadow-sm h-100">
                    <div style={{color: '#800000'}} className="mb-3">
                      <i className={`bi ${value.icon} fs-3`}></i>
                    </div>
                    <h3 className="h5" style={{color: '#800000'}}>{value.title}</h3>
                    <p className="text-muted mb-0">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

export default About