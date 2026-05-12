import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "Contact Us" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const telHref = `tel:${siteConfig.companyPhone.replace(/\s/g, "")}`;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">Contact Us</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Contact Us</span>
          </nav>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-form-wrapper">
              <h2>Get in Touch</h2>
              <p>
                Have a question or need a quote? Fill out the form below and
                we&apos;ll get back to you shortly.
              </p>
              <ContactForm preselectedProduct={product} />
            </div>

            <div className="contact-info-wrapper">
              <div className="contact-info-card">
                <h3>Contact Information</h3>

                <div className="contact-info-item">
                  <div className="info-icon"><i className="fas fa-building" /></div>
                  <div className="info-content">
                    <h4>Company Name</h4>
                    <p>{siteConfig.companyName}</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="info-icon"><i className="fas fa-map-marker-alt" /></div>
                  <div className="info-content">
                    <h4>Address</h4>
                    <p>{siteConfig.companyAddress}</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="info-icon"><i className="fas fa-phone" /></div>
                  <div className="info-content">
                    <h4>Phone Number</h4>
                    <a href={telHref}>{siteConfig.companyPhone}</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="info-icon"><i className="fas fa-envelope" /></div>
                  <div className="info-content">
                    <h4>Email Address</h4>
                    <a href={`mailto:${siteConfig.companyEmail}`}>
                      {siteConfig.companyEmail}
                    </a>
                  </div>
                </div>

                <div className="contact-social">
                  <h4>Connect With Us</h4>
                  <div className="social-links">
                    <a href={siteConfig.social.facebook}  target="_blank" rel="noopener" className="social-link facebook"  title="Facebook"><i className="fab fa-facebook-f" /></a>
                    <a href={siteConfig.social.instagram} target="_blank" rel="noopener" className="social-link instagram" title="Instagram"><i className="fab fa-instagram" /></a>
                    <a href={siteConfig.social.linkedin}  target="_blank" rel="noopener" className="social-link linkedin"  title="LinkedIn"><i className="fab fa-linkedin-in" /></a>
                    <a href={siteConfig.social.youtube}   target="_blank" rel="noopener" className="social-link youtube"   title="YouTube"><i className="fab fa-youtube" /></a>
                    <a href={siteConfig.social.x}         target="_blank" rel="noopener" className="social-link twitter"   title="X (Twitter)"><i className="fab fa-x-twitter" /></a>
                    <a href={siteConfig.social.threads}   target="_blank" rel="noopener" className="social-link threads"   title="Threads"><i className="fab fa-threads" /></a>
                  </div>
                </div>
              </div>

              <div className="business-hours-card">
                <h3><i className="fas fa-clock" /> Business Hours</h3>
                <ul className="hours-list">
                  <li><span>Monday - Friday</span><span>9:00 AM - 6:00 PM</span></li>
                  <li><span>Saturday</span><span>9:00 AM - 2:00 PM</span></li>
                  <li><span>Sunday</span><span>Closed</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section map-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Find Us</h2>
            <p className="section-subtitle">Visit our office in Bangalore</p>
          </div>
          <div className="map-wrapper">
            <iframe
              src={siteConfig.googleMapsEmbed}
              width="100%"
              height={450}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={siteConfig.googleMapsLink} target="_blank" rel="noopener" className="map-overlay-link">
              <i className="fas fa-external-link-alt" /> Open in Google Maps
            </a>
          </div>
        </div>
      </section>

      <section className="section quick-contact bg-light">
        <div className="container">
          <div className="quick-contact-grid">
            <a href={telHref} className="quick-contact-card">
              <div className="qc-icon"><i className="fas fa-phone" /></div>
              <h3>Call Us</h3>
              <p>{siteConfig.companyPhone}</p>
            </a>
            <a href={`mailto:${siteConfig.companyEmail}`} className="quick-contact-card">
              <div className="qc-icon"><i className="fas fa-envelope" /></div>
              <h3>Email Us</h3>
              <p>{siteConfig.companyEmail}</p>
            </a>
            <a
              href={`https://wa.me/${siteConfig.companyPhone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener"
              className="quick-contact-card"
            >
              <div className="qc-icon whatsapp"><i className="fab fa-whatsapp" /></div>
              <h3>WhatsApp</h3>
              <p>Chat with us</p>
            </a>
            <a href={siteConfig.googleMapsLink} target="_blank" rel="noopener" className="quick-contact-card">
              <div className="qc-icon"><i className="fas fa-directions" /></div>
              <h3>Get Directions</h3>
              <p>View on Maps</p>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
