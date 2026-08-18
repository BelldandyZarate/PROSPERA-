import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Programs = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      <main className="flex-grow-1">
        {/* Hero Section */}
        <section className="hero-section-programs text-white">
          <div className="hero-overlay"></div>
          <div className="container position-relative z-2 py-5">
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h1 className="display-4 fw-bold mb-4 text-shadow">Nuestros Programas</h1>
                <p className="lead">Conoce las iniciativas que transforman vidas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="section-title text-primary">Áreas de Impacto</h2>
                <p className="lead">Trabajamos en tres pilares fundamentales para el desarrollo comunitario</p>
              </div>
            </div>

            <div className="row g-4">
              {[
                {
                  title: "Educación para Todos",
                  description: "Programas educativos integrales para niños y jóvenes en situación vulnerable.",
                  icon: "bi-book",
                  stats: "5,000+ beneficiarios",
                  link: "/programas/educacion"
                },
                {
                  title: "Salud Comunitaria",
                  description: "Acceso a servicios médicos básicos y campañas de prevención.",
                  icon: "bi-heart-pulse",
                  stats: "120+ comunidades atendidas",
                  link: "/programas/salud"
                },
                {
                  title: "Emprendimiento Social",
                  description: "Capacitación y apoyo para el desarrollo de microempresas sostenibles.",
                  icon: "bi-briefcase",
                  stats: "800+ emprendimientos apoyados",
                  link: "/programas/emprendimiento"
                }
              ].map((program, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="program-card h-100 p-4 bg-white rounded shadow-sm border-top border-5 border-primary">
                    <div className="program-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                      <i className={`bi ${program.icon} fs-2 text-primary`}></i>
                    </div>
                    <h3 className="h4 text-primary text-center mb-3">{program.title}</h3>
                    <p className="text-muted text-center mb-4">{program.description}</p>
                    <p className="text-center text-gold fw-bold mb-4">{program.stats}</p>
                    <div className="text-center">
                      <a href={program.link} className="btn btn-outline-primary">
                        Conoce más <i className="bi bi-arrow-right ms-2"></i>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Programs */}
        <section className="py-5 bg-light-gold">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="section-title text-primary">Programas Destacados</h2>
                <p className="lead">Algunas de nuestras iniciativas más importantes</p>
              </div>
            </div>

            <div className="row g-4">
              {[
                {
                  title: "Escuelas Comunitarias",
                  category: "Educación",
                  description: "Creación y mejora de escuelas en zonas marginadas con modelo educativo integral.",
                  image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  title: "Salud Móvil",
                  category: "Salud",
                  description: "Unidades médicas móviles que llevan atención básica a comunidades remotas.",
                  image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  title: "Mujeres Emprendedoras",
                  category: "Emprendimiento",
                  description: "Programa de capacitación y financiamiento para emprendimientos liderados por mujeres.",
                  image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  title: "Becas Universitarias",
                  category: "Educación",
                  description: "Apoyo económico para jóvenes talentosos de escasos recursos.",
                  image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  title: "Nutrición Infantil",
                  category: "Salud",
                  description: "Programa de alimentación complementaria para niños en riesgo de desnutrición.",
                  image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  title: "Talleres Productivos",
                  category: "Emprendimiento",
                  description: "Capacitación en oficios para generar fuentes de ingreso sostenibles.",
                  image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                }
              ].map((program, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="featured-program h-100 bg-white rounded overflow-hidden shadow-sm">
                    <img 
                      src={program.image} 
                      alt={program.title} 
                      className="img-fluid w-100" 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="p-4">
                      <span className="badge bg-primary mb-2">{program.category}</span>
                      <h3 className="h5 text-primary mb-3">{program.title}</h3>
                      <p className="text-muted mb-4">{program.description}</p>
                      <a href="#" className="text-primary fw-bold text-decoration-none d-inline-flex align-items-center">
                        Ver detalles <i className="bi bi-arrow-right ms-2"></i>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-5">
              <a href="/todos-programas" className="btn btn-outline-primary px-4 fw-bold">
                Ver todos los programas
              </a>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row justify-content-center mb-5">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="section-title text-primary">Historias de Éxito</h2>
                <p className="lead">Lo que dicen quienes han participado en nuestros programas</p>
              </div>
            </div>

            <div className="row g-4">
              {[
                {
                  quote: "Gracias a la beca de Fundación Prosperidad pude terminar mis estudios y ahora soy ingeniero.",
                  author: "Juan Pérez",
                  role: "Becario 2018",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  quote: "El programa de emprendimiento me dio las herramientas para abrir mi propio negocio y mantener a mi familia.",
                  author: "María González",
                  role: "Emprendedora",
                  image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                  quote: "Las clínicas móviles salvaron la vida de mi hija cuando más lo necesitábamos.",
                  author: "Luisa Martínez",
                  role: "Madre beneficiaria",
                  image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                }
              ].map((testimonial, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="testimonial-card h-100 p-4 bg-light-gold rounded shadow-sm">
                    <div className="d-flex align-items-center mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author} 
                        className="rounded-circle me-3" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <div>
                        <h4 className="h6 mb-0 text-primary">{testimonial.author}</h4>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                    <blockquote className="mb-0">
                      <p className="font-italic">"{testimonial.quote}"</p>
                    </blockquote>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-5 bg-primary text-white">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-8 text-center">
                <h2 className="display-5 fw-bold mb-4 text-gold">¿Quieres apoyar nuestros programas?</h2>
                <p className="lead mb-5">
                  Tu contribución nos ayuda a seguir transformando vidas.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <a href="/donar" className="btn btn-gold btn-lg px-4 fw-bold">
                    Haz una Donación
                  </a>
                  <a href="/voluntariado" className="btn btn-outline-gold btn-lg px-4 fw-bold">
                    Ser Voluntario
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

export default Programs