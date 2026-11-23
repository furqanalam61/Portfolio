import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './animations.css';
import './responsive.css';
import './hero-center.css';
import './rounded.css';
import './contact-terminal.css';
import './whatsapp.css';
import AdminPanel from './AdminPanel';
import { DEFAULT_CONTENT, readPublishedContent } from './portfolioContent';
const floatingSkillSlots = ['expertise-react', 'expertise-design', 'expertise-js', 'expertise-css', 'expertise-node'];

function Arrow({ diagonal = false }) { return <span aria-hidden="true" className="arrow">{diagonal ? '↗' : '→'}</span>; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'FA'; }

function ProjectImageSlideshow({ images }) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { setActiveImage(index => index % images.length); }, [images.length]);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveImage(index => (index + 1) % images.length), 3500);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return <div className="project-image-slideshow" aria-hidden="true">
    {images.map((image, index) => <img className={index === activeImage ? 'is-active' : ''} src={image} alt="" key={`${index}-${image.slice(0, 32)}`} />)}
    <span className="project-image-shade"></span>
  </div>;
}

function App() {
  // The checked-in public/content.json is the published source of truth.
  // Browser storage is only an Admin editor draft and must never shadow it.
  const [content, setContent] = useState(() => DEFAULT_CONTENT);
  const copy = content.copy || DEFAULT_CONTENT.copy;
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(() => copy.allWorkLabel);
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100, visible: false });
  const projects = content.projects;
  const skillGroups = content.skills;
  const whatsappNumber = (content.links.whatsapp || '').replace(/\D/g, '');
  const navLinks = [[copy.navWork, '#work'], [copy.navAbout, '#about'], ...(content.education?.length ? [[copy.navEducation, '#education']] : []), [copy.navExperience, '#experience'], [copy.navContact, '#contact']];
  const filters = [copy.allWorkLabel, ...new Set(projects.map(project => project.type.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())))];
  const filteredProjects = activeFilter === copy.allWorkLabel ? projects : projects.filter(p => p.type.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) === activeFilter);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let active = true;
    readPublishedContent().then(published => { if (active) setContent(published); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => { document.title = copy.pageTitle || 'Furqan Alam Portfolio'; }, [copy.pageTitle]);

  useEffect(() => {
    if (activeFilter !== copy.allWorkLabel && !projects.some(project => project.type.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) === activeFilter)) setActiveFilter(copy.allWorkLabel);
  }, [content]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll('.section-heading, .project-card, .work-bottom, .about-label, .about-main, .skill-card, .experience-head, .timeline article, .contact-top, .contact h2, .contact-bottom');
    document.documentElement.classList.add('motion-ready');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-revealed'));
      return () => document.documentElement.classList.remove('motion-ready');
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    targets.forEach((target, index) => {
      target.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 90}ms`);
      observer.observe(target);
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('motion-ready');
    };
  }, [activeFilter, content]);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches) return;
    const onPointerMove = event => setCursorPosition({ x: event.clientX, y: event.clientY, visible: true });
    const onPointerLeave = () => setCursorPosition(position => ({ ...position, visible: false }));
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <>
    <span className="testing-cursor" aria-hidden="true" style={{ left: cursorPosition.x, top: cursorPosition.y, opacity: cursorPosition.visible ? 1 : 0 }}>
      <svg viewBox="0 0 36 34"><path d="M4 3 30 13 20 18 14 28Z" /></svg>
    </span>
    {whatsappNumber.length >= 8 && <a className="whatsapp-float" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" aria-label={copy.whatsappLabel} title={copy.whatsappLabel}>
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.05 3.2a12.65 12.65 0 0 0-10.8 19.24L3.6 28.8l6.52-1.7a12.65 12.65 0 1 0 5.93-23.9Zm0 22.96c-1.84 0-3.65-.5-5.22-1.45l-.37-.22-3.87 1.01 1.03-3.77-.24-.39a10.46 10.46 0 1 1 8.67 4.82Zm5.74-7.83c-.31-.15-1.83-.9-2.11-1-.28-.1-.49-.15-.7.16-.2.31-.8 1.01-.98 1.22-.18.2-.36.23-.67.08-.31-.15-1.3-.48-2.48-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.3-.02-.47.13-.62.14-.14.31-.36.46-.54.15-.18.2-.31.3-.52.1-.2.05-.38-.03-.54-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53h-.6c-.21 0-.54.08-.82.38-.28.31-1.07 1.05-1.07 2.57s1.1 2.98 1.25 3.18c.15.2 2.16 3.3 5.23 4.63.73.31 1.3.5 1.75.64.74.23 1.42.2 1.95.12.6-.09 1.83-.75 2.08-1.48.26-.72.26-1.34.18-1.48-.08-.13-.28-.2-.59-.36Z" /></svg>
    </a>}
    <header className={`topbar ${menuOpen ? 'nav-open' : ''}`}>
      <a className="wordmark" href="#home" aria-label={`${content.name} home`} onClick={closeMenu}>{initials(content.name)}<span>.</span></a>
      <span className="top-note">{copy.topRole} <i>·</i> {copy.topLocation}</span>
      <nav className="desktop-menu" aria-label={copy.navigationLabel}>
        {navLinks.map(([label, href]) => <a className={label === copy.navContact ? 'nav-contact' : ''} href={href} key={href} onClick={closeMenu}>{label}{label === copy.navContact && <Arrow diagonal />}</a>)}
      </nav>
      <button className={`menu-toggle ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? copy.closeMenuLabel : copy.openMenuLabel}>
        <span></span><span></span>
      </button>
    </header>
    {menuOpen && <><button className="drawer-backdrop" aria-label={copy.closeDrawerLabel} onClick={closeMenu}></button><nav className="mobile-drawer" aria-label={copy.navigationLabel}>
      <button className="drawer-close" aria-label={copy.closeMenuLabel} onClick={closeMenu}>×</button>
      <p className="drawer-kicker">{copy.drawerTitle} <span>✳</span></p>
      {navLinks.map(([label, href], index) => <a href={href} key={label} onClick={closeMenu}><span className="drawer-index">0{index + 1}</span>{label}<Arrow diagonal /></a>)}
      <p className="drawer-status"><span className="live-dot"></span>{copy.drawerAvailability}</p>
    </nav></>}

    <main>
      <section className="hero section-wrap" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot"></span> {copy.heroEyebrow}</p>
          <h1>{copy.heroTitleLine1}<br />{copy.heroTitleLine2}<br /><em>{copy.heroTitleEmphasis}</em></h1>
          <p className="hero-intro">{copy.heroIntro}</p>
          <div className="hero-actions"><a className="button button-primary" href="#work">{copy.heroWorkCta} <Arrow /></a><a className="text-link" href="#about">{copy.heroAboutCta} <Arrow /></a><a className="text-link cv-download" href={content.cv || '/furqan-alam-cv.pdf'} download={content.cv ? content.cvName : 'furqan-alam-cv.pdf'}>{copy.heroCvCta} <span aria-hidden="true">↓</span></a></div>
          <div className="hero-meta"><span>{copy.heroLocation}</span><span className="meta-line"></span><span>{copy.heroAvailability} <b>●</b></span></div>
        </div>
        <div className="hero-art" aria-label="Abstract portrait illustration">
          <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
          {content.floatingSkills.map((skill, index) => {
            if (index < floatingSkillSlots.length) return <span className={`expertise-chip ${floatingSkillSlots[index]}`} key={`${skill}-${index}`}>{skill}</span>;
            const extraIndex = index - floatingSkillSlots.length;
            const extraCount = content.floatingSkills.length - floatingSkillSlots.length;
            const angle = -Math.PI / 2 + (Math.PI * 2 * extraIndex) / extraCount;
            const style = {
              left: `${50 + Math.cos(angle) * 44}%`,
              top: `${50 + Math.sin(angle) * 44}%`,
              animationDelay: `${-((extraIndex % 8) * 0.6)}s`,
            };
            return <span className="expertise-chip expertise-extra" style={style} key={`${skill}-${index}`}>{skill}</span>;
          })}
          <div className="portrait-card"><div className="sun-disc"></div><div className="portrait-backdrop"></div><img className="portrait-photo" src={content.photo || '/furqan-portrait.png'} alt={`${content.name} portrait`} /><div className="portrait-caption"><span>{content.name.toUpperCase()}</span><span>{copy.portraitCaption} <i>↗</i></span></div></div>
          <div className="orbit-note"><span>✳</span><small>{copy.portraitBadgeTop}<br />{copy.portraitBadgeBottom}</small></div>
        </div>
        <a href="#work" className="scroll-cue"><span className="scroll-dot"></span> {copy.scrollCue}</a>
      </section>

      <section className="work section-wrap section-block" id="work">
        <div className="section-heading"><div><p className="eyebrow">{copy.workEyebrow}</p><h2>{copy.workTitle} <em>{copy.workEmphasis}</em></h2></div><p className="section-aside">{copy.workAside.split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</p></div>
        <div className="filter-row" role="group" aria-label={copy.projectFilterLabel}>{filters.map(f => <button className={activeFilter === f ? 'active' : ''} onClick={() => setActiveFilter(f)} key={f}>{f}<span>{f === copy.allWorkLabel ? String(projects.length).padStart(2, '0') : String(projects.filter(project => project.type.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) === f).length).padStart(2, '0')}</span></button>)}</div>
        <div className="project-grid">{filteredProjects.map((p, index) => <article className="project-card" key={`${p.number}-${p.name}`}>
          <a className={`project-visual ${p.tone}${p.images?.length ? ' has-project-images' : ''}`} href={p.url || '#contact'} target={p.url ? '_blank' : undefined} rel={p.url ? 'noreferrer' : undefined} aria-label={p.url ? `${copy.projectOpenPrefix} ${p.name}` : `${copy.projectAskPrefix} ${p.name}`}>{p.images?.length > 0 && <ProjectImageSlideshow images={p.images} />}<span className="project-number">{p.number || String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>{!p.images?.length && <span className="project-symbol">{p.icon || '✳'}</span>}<span className="project-visual-caption">{copy.projectCaptionPrefix} <b>{p.type}</b></span><span className="project-open"><Arrow diagonal /></span></a>
          <div className="project-info"><p className="eyebrow">{p.type}</p><h3>{p.name}</h3><p>{p.description}</p><div className="tag-row">{p.stack.map(t => <span key={t}>{t}</span>)}</div></div>
        </article>)}</div>
        <div className="work-bottom"><span>{copy.workFooter}</span><a href={content.links.github} target="_blank" rel="noreferrer">{copy.githubCta} <Arrow diagonal /></a></div>
      </section>

      <section className="about section-wrap section-block" id="about">
        <div className="about-label"><p className="eyebrow">{copy.aboutEyebrow}</p><span className="about-stamp">✳<small>{copy.aboutStampTop}<br />{copy.aboutStampBottom}</small></span></div>
        <div className="about-main"><h2>{content.about.title}<br /><em>{content.about.emphasis}</em></h2>{content.about.paragraphs.map((paragraph, index) => <p className={`about-copy${index > 0 ? ' muted' : ''}`} key={index}>{paragraph}</p>)}
          <div className="about-facts">{content.about.facts.map((fact, index) => <div key={`${fact.label}-${index}`}><span>{fact.label}</span><b>{fact.text}</b></div>)}</div>
        </div>
      </section>

      <section className="skills section-wrap section-block"><div className="section-heading"><div><p className="eyebrow">{copy.skillsEyebrow}</p><h2>{copy.skillsTitle}<br /><em>{copy.skillsEmphasis}</em></h2></div><p className="section-aside">{copy.skillsAside.split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</p></div>
        <div className="skill-grid">{skillGroups.map(({ title, items }) => <div className="skill-card" key={title}><p className="eyebrow">{title}</p><div>{items.map(item => <span key={item}>{item}</span>)}</div></div>)}</div>
      </section>

      <section className="experience section-wrap section-block" id="experience"><div className="experience-head"><div><p className="eyebrow">{copy.experienceEyebrow}</p><h2>{copy.experienceTitle}<br /><em>{copy.experienceEmphasis}</em></h2></div><p>{copy.experienceAside}</p></div>
        <div className="timeline">{[...content.experience].reverse().map((item, index) => <article key={`${item.date}-${item.title}-${index}`}><span className="timeline-date">{item.date}</span><div><h3>{item.title}</h3><p>{item.organization}</p><span>{item.description}</span></div><b>{String(index + 1).padStart(2, '0')}</b></article>)}</div>
      </section>

      {content.education?.length > 0 && <section className="education section-wrap section-block" id="education"><div className="experience-head"><div><p className="eyebrow">{copy.educationEyebrow}</p><h2>{copy.educationTitle}<br /><em>{copy.educationEmphasis}</em></h2></div><p>{copy.educationAside}</p></div>
        <div className="timeline">{[...content.education].reverse().map((item, index) => { const results = [item.cgpa && `CGPA: ${item.cgpa}`, item.marks && `Marks: ${item.marks}`, item.description].filter(Boolean); return <article key={`${item.date}-${item.degree}-${index}`}><span className="timeline-date">{item.date}</span><div><h3>{item.degree}</h3><p>{item.institution}</p>{results.length > 0 && <span>{results.join(' · ')}</span>}</div><b>{String(index + 1).padStart(2, '0')}</b></article>; })}</div>
      </section>}

      <section className="contact section-wrap" id="contact">
        <div className="contact-copy">
          <div className="contact-top"><p className="eyebrow"><span className="live-dot"></span> {copy.contactEyebrow}</p><span className="contact-scribble">✳</span></div>
          <h2>{copy.contactTitleLine1}<br />{copy.contactTitleLine2} <em>{copy.contactTitleEmphasis}</em></h2>
          <div className="contact-bottom"><p>{copy.contactBlurb.split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</p><a className="button button-primary contact-terminal-cta" href={`mailto:${content.links.email}`}>{copy.contactButton} <Arrow diagonal /></a></div>
        </div>
        <div className="contact-terminal" aria-label={copy.terminalLabel}>
          <div className="terminal-topbar"><span className="terminal-lights"><i></i><i></i><i></i></span><span>{copy.terminalFile}</span></div>
          <div className="terminal-content">
            <p><b>$</b> {copy.terminalWhoCommand}</p><p className="terminal-result">{content.name} — {copy.terminalRole}</p>
            <p className="terminal-command"><b>$</b> {copy.terminalStatusCommand}</p>
            <p className="terminal-status"><i>✓</i> {copy.terminalAvailable}</p>
            <p className="terminal-status"><i>✓</i> {copy.terminalResponse}</p>
            <p className="terminal-status"><i>✓</i> {copy.terminalLocation}</p>
            <a className="terminal-connect" href={`mailto:${content.links.email}`}><b>$</b> {copy.terminalEmailCommand} <span>↗</span></a>
          </div>
        </div>
      </section>
    </main>
    <footer className="footer section-wrap"><a className="wordmark" href="#home">{initials(content.name)}<span>.</span></a><p>{content.footerText || 'DESIGNED & BUILT WITH ❤️'} <span>✳</span> {copy.footerYear}</p><div><a href={content.links.github} target="_blank" rel="noreferrer">{copy.footerGithubLabel} <Arrow diagonal /></a><a href={content.links.linkedin} target="_blank" rel="noreferrer">{copy.footerLinkedinLabel} <Arrow diagonal /></a><a href="#home">{copy.footerBackToTop}</a></div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(window.location.pathname === '/admin' ? <AdminPanel /> : <App />);
