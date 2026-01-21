import { useEffect, useState } from 'react';
import { 
  Smartphone, 
  Zap, 
  Shield, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      fetch('/api/hello')
        .then(res => res.json())
        .then(data => {
          setMessage(data.message);
          setIsLoading(false);
        })
        .catch(err => {
          console.log('Error:', err);
          setIsLoading(false);
        });
    }, 1000);
  }, []);

  const features = [
    { icon: <Smartphone />, title: 'Mobile First', desc: 'Diseño optimizado para dispositivos móviles' },
    { icon: <Zap />, title: 'Rendimiento', desc: 'Carga ultra rápida con Vite' },
    { icon: <Shield />, title: 'Seguro', desc: 'Arquitectura moderna y segura' },
    { icon: <Users />, title: 'Escalable', desc: 'Fácil de mantener y escalar' },
  ];

  const testimonials = [
    { name: 'María García', role: 'CEO TechStart', text: 'Increíble experiencia de usuario en todos los dispositivos.' },
    { name: 'Carlos López', role: 'Design Lead', text: 'El diseño responsive es impecable.' },
    { name: 'Ana Rodríguez', role: 'Frontend Dev', text: 'Me encanta cómo se adapta a cada pantalla.' },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Diseño <span className="highlight">Responsive</span> que se adapta a <span className="highlight">cualquier dispositivo</span>
              </h1>
              <p className="hero-subtitle">
                Una experiencia de usuario perfecta en móviles, tablets y desktop
              </p>
              <div className="hero-buttons">
                <button className="btn btn-primary btn-lg">
                  Comenzar ahora
                  <ArrowRight className="btn-icon" />
                </button>
                <button className="btn btn-outline btn-lg">
                  Ver demo
                </button>
              </div>
            </div>
            <div className="hero-image">
              <div className="device-mockup">
                <div className="device-screen">
                  <div className="screen-content">
                    <div className="app-bar"></div>
                    <div className="app-grid">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="app-icon"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-4">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Características Principales</h2>
            <p className="section-subtitle">Diseñado para ofrecer la mejor experiencia en todos los dispositivos</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsive Demo Section */}
      <section className="responsive-demo py-4">
        <div className="container">
          <div className="demo-header">
            <h2>Adaptabilidad Total</h2>
            <p>Mira cómo se adapta el contenido a diferentes tamaños de pantalla</p>
          </div>
          <div className="demo-grid">
            <div className="demo-card mobile-view">
              <div className="demo-title">📱 Móvil</div>
              <div className="demo-content">
                <p>Perfecto para smartphones</p>
                <ul className="demo-list">
                  <li><CheckCircle size={16} /> Menú hamburguesa</li>
                  <li><CheckCircle size={16} /> Contenido vertical</li>
                  <li><CheckCircle size={16} /> Touch friendly</li>
                </ul>
              </div>
            </div>
            <div className="demo-card tablet-view">
              <div className="demo-title">📓 Tablet</div>
              <div className="demo-content">
                <p>Optimizado para tablets</p>
                <ul className="demo-list">
                  <li><CheckCircle size={16} /> Dos columnas</li>
                  <li><CheckCircle size={16} /> Menú expandido</li>
                  <li><CheckCircle size={16} /> Mayor espacio</li>
                </ul>
              </div>
            </div>
            <div className="demo-card desktop-view">
              <div className="demo-title">🖥️ Desktop</div>
              <div className="demo-content">
                <p>Experiencia completa</p>
                <ul className="demo-list">
                  <li><CheckCircle size={16} /> Múltiples columnas</li>
                  <li><CheckCircle size={16} /> Menú completo</li>
                  <li><CheckCircle size={16} /> Máximo detalle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials py-4">
        <div className="container">
          <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  "{testimonial.text}"
                </div>
                <div className="testimonial-author">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta py-4">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para comenzar?</h2>
            <p>Prueba nuestro diseño responsive en cualquier dispositivo</p>
            <button className="btn btn-primary btn-lg">
              Probar ahora gratis
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;