import React, { useEffect, useState } from 'react';
import { CONTENT_KEY, DEFAULT_CONTENT, readContent, readPublishedContent, writeContent } from './portfolioContent';
import './admin.css';
import './admin-overrides.css';

const PASSWORD_KEY = 'furqan-admin-password-hash-v1';
const SESSION_KEY = 'furqan-admin-session-v1';
const copyEditorGroups = [
  { title: 'Browser tab', fields: [['pageTitle', 'Page title']] },
  { title: 'Header & navigation', fields: [['topRole', 'Header role'], ['topLocation', 'Header location'], ['navWork', 'Work link'], ['navAbout', 'About link'], ['navEducation', 'Education link'], ['navExperience', 'Experience link'], ['navContact', 'Contact link'], ['drawerTitle', 'Mobile menu heading'], ['drawerAvailability', 'Mobile menu status'], ['navigationLabel', 'Navigation screen reader label'], ['openMenuLabel', 'Open menu screen reader label'], ['closeMenuLabel', 'Close menu screen reader label'], ['closeDrawerLabel', 'Close drawer screen reader label']] },
  { title: 'Hero section', fields: [['heroEyebrow', 'Intro label'], ['heroTitleLine1', 'Headline line 1'], ['heroTitleLine2', 'Headline line 2'], ['heroTitleEmphasis', 'Highlighted headline'], ['heroIntro', 'Introduction', true], ['heroWorkCta', 'Work button'], ['heroAboutCta', 'About link'], ['heroCvCta', 'CV link'], ['heroLocation', 'Location label'], ['heroAvailability', 'Availability label'], ['portraitCaption', 'Photo caption'], ['portraitBadgeTop', 'Floating badge line 1'], ['portraitBadgeBottom', 'Floating badge line 2'], ['scrollCue', 'Scroll prompt']] },
  { title: 'Work section', fields: [['workEyebrow', 'Section label'], ['workTitle', 'Heading'], ['workEmphasis', 'Highlighted heading'], ['workAside', 'Side description', true], ['allWorkLabel', 'All projects filter'], ['projectFilterLabel', 'Filter screen reader label'], ['projectCaptionPrefix', 'Project card caption'], ['projectOpenPrefix', 'Project open label'], ['projectAskPrefix', 'Project inquiry label'], ['workFooter', 'Bottom note'], ['githubCta', 'GitHub link label']] },
  { title: 'About, skills, experience & education', fields: [['aboutEyebrow', 'About label'], ['aboutStampTop', 'About badge line 1'], ['aboutStampBottom', 'About badge line 2'], ['skillsEyebrow', 'Skills label'], ['skillsTitle', 'Skills heading'], ['skillsEmphasis', 'Highlighted skills heading'], ['skillsAside', 'Skills description', true], ['experienceEyebrow', 'Experience label'], ['experienceTitle', 'Experience heading'], ['experienceEmphasis', 'Highlighted experience heading'], ['experienceAside', 'Experience description', true], ['educationEyebrow', 'Education label'], ['educationTitle', 'Education heading'], ['educationEmphasis', 'Highlighted education heading'], ['educationAside', 'Education description', true]] },
  { title: 'Contact section', fields: [['contactEyebrow', 'Contact label'], ['contactTitleLine1', 'Heading line 1'], ['contactTitleLine2', 'Heading line 2'], ['contactTitleEmphasis', 'Highlighted heading'], ['contactBlurb', 'Short message', true], ['contactButton', 'Contact button'], ['terminalFile', 'Terminal title'], ['terminalLabel', 'Terminal screen reader label'], ['terminalWhoCommand', 'Terminal identity command'], ['terminalRole', 'Role after your name'], ['terminalStatusCommand', 'Terminal status command'], ['terminalAvailable', 'Availability status'], ['terminalResponse', 'Response time status'], ['terminalLocation', 'Location status'], ['terminalEmailCommand', 'Email command'], ['whatsappLabel', 'WhatsApp button label']] },
  { title: 'Footer', fields: [['footerYear', 'Year'], ['footerGithubLabel', 'GitHub link label'], ['footerLinkedinLabel', 'LinkedIn link label'], ['footerBackToTop', 'Back to top label']] },
];

async function hashPassword(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function AdminLogin({ hasPassword, onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!hasPassword && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    if (!hasPassword && password !== confirmPassword) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await onAuthenticate(password, !hasPassword);
      if (!result) setError('That password is incorrect. Try again.');
    } catch {
      setError('Could not verify your password in this browser.');
    } finally { setBusy(false); }
  };

  const initials = readContent().name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'FA';
  return <main className="admin-login-shell"><a className="admin-brand" href="/">{initials}<span>.</span><small>PORTFOLIO ADMIN</small></a><form className="admin-login-card" onSubmit={submit}>
    <p className="admin-kicker">PRIVATE AREA</p><h1>{hasPassword ? 'Welcome back.' : 'Set your admin password.'}</h1><p>{hasPassword ? 'Enter your password to manage the portfolio.' : 'Create a password to lock this admin page in this browser.'}</p>
    <label>Password<input type="password" autoComplete={hasPassword ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} required autoFocus /></label>
    {!hasPassword && <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required /></label>}
    {error && <p className="admin-login-error" role="alert">{error}</p>}
    <button className="admin-save" type="submit" disabled={busy}>{busy ? 'Please wait…' : hasPassword ? 'Log in' : 'Create password'} <span>↗</span></button>
    <small>This password is saved only in this browser. It does not secure a public deployment.</small>
  </form></main>;
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

async function optimizedPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1500 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  if (!blob) throw new Error('Could not process this image.');
  return fileAsDataUrl(new File([blob], 'portfolio-photo.jpg', { type: 'image/jpeg' }));
}

async function optimizedProjectImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process this image.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) throw new Error('Could not process this image.');
  return fileAsDataUrl(new File([blob], 'project-image.jpg', { type: 'image/jpeg' }));
}

function safeAssetName(name, fallback) {
  return (name || fallback).split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || fallback;
}

function zipCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const file of files) {
    const name = encoder.encode(file.path);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = zipCrc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0x0021, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0x0021, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    central.set(name, 46);

    localParts.push(local, data);
    centralParts.push(central);
    localOffset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

async function exportWebsiteFiles(content) {
  const exported = JSON.parse(JSON.stringify(content));
  const assets = [];
  const externalize = async (value, path) => {
    if (typeof value !== 'string') return value;
    if (value.startsWith('data:')) {
      const response = await fetch(value);
      assets.push({ path, blob: await response.blob() });
      return `/${path}`;
    }
    // Existing site-local assets must be copied into the ZIP too. Otherwise
    // an image already saved as /media/... would be referenced but omitted.
    if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
      const assetPath = new URL(value, window.location.href).pathname.replace(/^\/+/, '');
      const response = await fetch(value);
      if (!response.ok) throw new Error(`Could not read ${assetPath}`);
      assets.push({ path: assetPath, blob: await response.blob() });
    }
    return value;
  };

  exported.photo = await externalize(exported.photo, 'media/profile/profile-photo.jpg');
  if (exported.cv?.startsWith('data:')) {
    const fileName = safeAssetName(exported.cvName, 'portfolio-cv.pdf');
    exported.cv = await externalize(exported.cv, `media/cv/${fileName}`);
    exported.cvName = fileName;
  }
  exported.projects = await Promise.all((exported.projects || []).map(async (project, projectIndex) => ({
    ...project,
    images: await Promise.all((project.images || []).map((image, imageIndex) => externalize(
      image,
      `media/projects/project-${String(projectIndex + 1).padStart(2, '0')}-image-${String(imageIndex + 1).padStart(2, '0')}.jpg`
    ))),
  })));

  const jsonBlob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: 'application/json' });
  const projectImageCount = (exported.projects || []).reduce((total, project) => total + (project.images || []).length, 0);
  const archiveFiles = [{ path: 'content.json', blob: jsonBlob }, ...assets];
  return { assetCount: assets.length, projectImageCount, zipBlob: await createZip(archiveFiles) };
}

export default function AdminPanel() {
  const [content, setContent] = useState(() => readContent());
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'active');
  const [hasPassword, setHasPassword] = useState(() => Boolean(localStorage.getItem(PASSWORD_KEY)));
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState('');
  const [draggingProject, setDraggingProject] = useState(null);
  const [draggingProjectTool, setDraggingProjectTool] = useState(null);
  useEffect(() => {
    // Use the checked-in content file when this browser has no local editor draft.
    if (localStorage.getItem(CONTENT_KEY)) return;
    let active = true;
    readPublishedContent().then(published => { if (active) setContent(published); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const update = (key, value) => setContent(current => ({ ...current, [key]: value }));
  const updateCopy = (key, value) => setContent(current => ({ ...current, copy: { ...DEFAULT_CONTENT.copy, ...current.copy, [key]: value } }));
  const updateLink = (key, value) => setContent(current => ({ ...current, links: { ...current.links, [key]: value } }));
  const updateProject = (index, key, value) => setContent(current => ({ ...current, projects: current.projects.map((project, i) => i === index ? { ...project, [key]: value } : project) }));
  const reorderProjects = (from, to) => {
    if (from == null || from === to) return;
    setContent(current => {
      const projects = [...current.projects];
      const [moved] = projects.splice(from, 1);
      projects.splice(to, 0, moved);
      return { ...current, projects };
    });
  };
  const reorderProjectTools = (projectIndex, from, to) => {
    if (from == null || from === to) return;
    setContent(current => ({ ...current, projects: current.projects.map((project, index) => {
      if (index !== projectIndex) return project;
      const stack = [...(project.stack || [])];
      const [moved] = stack.splice(from, 1);
      stack.splice(to, 0, moved);
      return { ...project, stack };
    }) }));
  };
  const updateProjectTool = (projectIndex, toolIndex, value) => setContent(current => ({ ...current, projects: current.projects.map((project, i) => i === projectIndex ? { ...project, stack: (project.stack || []).map((tool, j) => j === toolIndex ? value : tool) } : project) }));
  const updateSkill = (index, key, value) => setContent(current => ({ ...current, skills: current.skills.map((skill, i) => i === index ? { ...skill, [key]: value } : skill) }));
  const addSkillToGroup = index => {
    setContent(current => ({ ...current, skills: current.skills.map((skill, i) => i === index ? { ...skill, items: [...(skill.items || []), 'New skill'] } : skill) }));
    setNotice(`Added a skill field to group ${String(index + 1).padStart(2, '0')}. Enter its name, then save changes.`);
    setNoticeError(false);
  };
  const updateExperience = (index, key, value) => setContent(current => ({ ...current, experience: current.experience.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const updateEducation = (index, key, value) => setContent(current => ({ ...current, education: current.education.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const updateAbout = (key, value) => setContent(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const updateAboutFact = (index, key, value) => setContent(current => ({ ...current, about: { ...current.about, facts: current.about.facts.map((fact, i) => i === index ? { ...fact, [key]: value } : fact) } }));

  useEffect(() => { document.title = 'Portfolio Admin — Furqan Alam'; }, []);

  const authenticate = async (password, setup) => {
    const hash = await hashPassword(password);
    if (setup) {
      localStorage.setItem(PASSWORD_KEY, hash);
      setHasPassword(true);
    } else if (hash !== localStorage.getItem(PASSWORD_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, 'active');
    setAuthenticated(true);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  };

  const handlePhoto = async file => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setNoticeError(true); setNotice('Choose an image file.'); return; }
    try { update('photo', await optimizedPhoto(file)); setNoticeError(false); setNotice('Photo ready. Save changes to publish it in this browser.'); }
    catch { setNoticeError(true); setNotice('Could not process this image. Try a different file.'); }
  };

  const handleCv = async file => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setNoticeError(true); setNotice('Choose a PDF file for your CV.'); return; }
    if (file.size > 2 * 1024 * 1024) { setNoticeError(true); setNotice('For browser storage, keep the PDF under 2 MB.'); return; }
    try { update('cv', await fileAsDataUrl(file)); update('cvName', file.name); setNoticeError(false); setNotice('CV ready. Save changes to publish it in this browser.'); }
    catch { setNoticeError(true); setNotice('Could not read this PDF. Try a different file.'); }
  };

  const handleProjectImages = async (index, files) => {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    if (selectedFiles.some(file => !file.type.startsWith('image/'))) { setNoticeError(true); setNotice('Choose image files for project galleries.'); return; }
    try {
      const images = await Promise.all(selectedFiles.map(optimizedProjectImage));
      setContent(current => ({ ...current, projects: current.projects.map((project, projectIndex) => projectIndex === index ? { ...project, images: [...(project.images || []), ...images] } : project) }));
      setNoticeError(false);
      setNotice(`${images.length} project image${images.length === 1 ? '' : 's'} added. Save changes to apply them.`);
    } catch {
      setNoticeError(true);
      setNotice('Could not process the selected project images. Try smaller image files.');
    }
  };

  const save = () => {
    try {
      writeContent(content);
      setNoticeError(false);
      setNotice('Saved. The portfolio in this browser now shows your updates.');
    } catch {
      setNoticeError(true);
      setNotice('Browser storage is full. Use a smaller CV or photo, then try again.');
    }
  };

  const exportFiles = async () => {
    try {
      const result = await exportWebsiteFiles(content);
      if (exportDownloadUrl) URL.revokeObjectURL(exportDownloadUrl);
      setExportDownloadUrl(URL.createObjectURL(result.zipBlob));
      setNoticeError(false);
      const imageNotice = result.projectImageCount ? ` Project gallery images: ${result.projectImageCount}.` : ' No project images are currently in the admin data.';
      setNotice(`Export package is ready with content.json and ${result.assetCount} media file${result.assetCount === 1 ? '' : 's'}.${imageNotice} Click Download ZIP below, then extract it into public/.`);
    } catch (error) {
      setNoticeError(true);
      setNotice('Could not prepare the export ZIP. Try again.');
    }
  };

  const reset = () => {
    setContent({ ...DEFAULT_CONTENT, links: { ...DEFAULT_CONTENT.links }, copy: { ...DEFAULT_CONTENT.copy }, about: { ...DEFAULT_CONTENT.about, paragraphs: [...DEFAULT_CONTENT.about.paragraphs], facts: DEFAULT_CONTENT.about.facts.map(fact => ({ ...fact })) }, floatingSkills: [...DEFAULT_CONTENT.floatingSkills], projects: DEFAULT_CONTENT.projects.map(project => ({ ...project, stack: [...project.stack], images: [...(project.images || [])] })), skills: DEFAULT_CONTENT.skills.map(skill => ({ ...skill, items: [...skill.items] })), experience: DEFAULT_CONTENT.experience.map(item => ({ ...item })), education: DEFAULT_CONTENT.education.map(item => ({ ...item })) });
    setNotice('Defaults restored in the editor. Save changes to apply them.');
    setNoticeError(false);
  };

  if (!authenticated) return <AdminLogin hasPassword={hasPassword} onAuthenticate={authenticate} />;

  return <div className="admin-shell">
    <header className="admin-header">
      <a className="admin-brand" href="/">{content.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'FA'}<span>.</span><small>PORTFOLIO ADMIN</small></a>
      <div className="admin-header-actions"><a className="admin-back" href="/">View portfolio ↗</a><button className="admin-logout" onClick={logout}>Log out</button></div>
    </header>
    <main className="admin-main">
      <div className="admin-intro"><p className="admin-kicker">SITE CONTENT</p><h1>Keep your portfolio<br /><em>up to date.</em></h1><p>Edit your profile, all portfolio sections, links, and the copy used throughout the website.</p></div>
      <div className="admin-local-note"><b>File-based publishing</b><span>Save changes in this browser, then export website files into the project’s public folder. Commit and redeploy to publish them for everyone.</span></div>

      <section className="admin-section"><div className="admin-section-heading"><span>01</span><div><h2>Profile assets</h2><p>Upload the portrait and PDF used on your site.</p></div></div>
        <div className="admin-asset-grid">
          <label className="admin-upload-card"><span className="admin-preview">{content.photo ? <img src={content.photo} alt="Uploaded profile preview" /> : <span className="admin-placeholder">FA.</span>}</span><span className="admin-field-label">Profile photo</span><span className="admin-field-hint">Image files · resized for the website</span><span className="admin-file-button">Choose image<input type="file" accept="image/*" onChange={event => handlePhoto(event.target.files?.[0])} /></span></label>
          <label className="admin-upload-card admin-cv-card"><span className="admin-cv-icon">PDF</span><span className="admin-field-label">Curriculum vitae</span><span className="admin-field-hint">{content.cvName || 'PDF file · up to 2 MB'}</span><span className="admin-file-button">Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={event => handleCv(event.target.files?.[0])} /></span></label>
        </div>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>02</span><div><h2>Name &amp; links</h2><p>Update the name shown across your site and your contact links.</p></div></div>
        <div className="admin-form-grid"><label>Display name<input value={content.name} onChange={event => update('name', event.target.value)} placeholder="Your full name" /></label><label>Email address<input type="email" value={content.links.email} onChange={event => updateLink('email', event.target.value)} placeholder="you@example.com" /></label><label>WhatsApp number<input type="tel" value={content.links.whatsapp || ''} onChange={event => updateLink('whatsapp', event.target.value)} placeholder="+92 300 1234567" /><small className="admin-field-hint">Include the country code. The floating chat button appears after you save.</small></label><label>GitHub URL<input type="url" value={content.links.github} onChange={event => updateLink('github', event.target.value)} placeholder="https://github.com/you" /></label><label>LinkedIn URL<input type="url" value={content.links.linkedin} onChange={event => updateLink('linkedin', event.target.value)} placeholder="https://linkedin.com/in/you" /></label><label className="admin-wide">Footer credit<input value={content.footerText || ''} onChange={event => update('footerText', event.target.value)} placeholder="DESIGNED & BUILT WITH ❤️" /><small className="admin-field-hint">Add your footer message; the star and year remain alongside it.</small></label></div>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>03</span><div><h2>Skills</h2><p>Add and edit individual skills inside each group.</p></div></div>
        <div className="admin-skill-list">{content.skills.map((skill, index) => <div className="admin-skill-row" key={index}>
          <div className="admin-skill-group-head"><label>Group title<input value={skill.title} onChange={event => updateSkill(index, 'title', event.target.value)} /></label><button className="admin-remove" onClick={() => update('skills', content.skills.filter((_, i) => i !== index))} aria-label={`Remove ${skill.title}`}>×</button></div>
          <div className="admin-skill-items">{skill.items.map((item, skillIndex) => <div className="admin-skill-item" key={skillIndex}><label>Skill {String(skillIndex + 1).padStart(2, '0')}<input value={item} onChange={event => updateSkill(index, 'items', skill.items.map((value, i) => i === skillIndex ? event.target.value : value))} /></label><button className="admin-remove" onClick={() => updateSkill(index, 'items', skill.items.filter((_, i) => i !== skillIndex))} aria-label={`Remove ${item} from ${skill.title}`}>×</button></div>)}</div>
          <button type="button" className="admin-add" aria-label={`Add skill to group ${String(index + 1).padStart(2, '0')}: ${skill.title}`} onClick={() => addSkillToGroup(index)}>＋ Add skill to group {String(index + 1).padStart(2, '0')}</button>
        </div>)}</div>
        <button className="admin-add" onClick={() => update('skills', [...content.skills, { title: `${String(content.skills.length + 1).padStart(2, '0')} / NEW GROUP`, items: [] }])}>＋ Add skill group</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>04</span><div><h2>About me</h2><p>Edit the headline, biography paragraphs, and profile facts.</p></div></div>
        <div className="admin-form-grid admin-about-fields"><label>Headline<input value={content.about.title} onChange={event => updateAbout('title', event.target.value)} /></label><label>Emphasized headline<input value={content.about.emphasis} onChange={event => updateAbout('emphasis', event.target.value)} /></label></div>
        <div className="admin-about-list">{content.about.paragraphs.map((paragraph, index) => <div className="admin-about-row" key={index}><label>Biography paragraph {String(index + 1).padStart(2, '0')}<textarea rows="3" value={paragraph} onChange={event => updateAbout('paragraphs', content.about.paragraphs.map((item, i) => i === index ? event.target.value : item))} /></label><button className="admin-remove" onClick={() => updateAbout('paragraphs', content.about.paragraphs.filter((_, i) => i !== index))} aria-label={`Remove biography paragraph ${index + 1}`}>×</button></div>)}</div>
        <button className="admin-add" onClick={() => updateAbout('paragraphs', [...content.about.paragraphs, 'Write a little about yourself.'])}>＋ Add paragraph</button>
        <div className="admin-about-list admin-about-facts">{content.about.facts.map((fact, index) => <div className="admin-about-row" key={index}><label>Fact label<input value={fact.label} onChange={event => updateAboutFact(index, 'label', event.target.value)} /></label><label>Fact text<textarea rows="2" value={fact.text} onChange={event => updateAboutFact(index, 'text', event.target.value)} /></label><button className="admin-remove" onClick={() => updateAbout('facts', content.about.facts.filter((_, i) => i !== index))} aria-label={`Remove fact ${fact.label}`}>×</button></div>)}</div>
        <button className="admin-add" onClick={() => updateAbout('facts', [...content.about.facts, { label: 'NEW / FACT', text: 'Add a short detail.' }])}>＋ Add profile fact</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>05</span><div><h2>Floating photo skills</h2><p>Add as many labels as you want; they’ll arrange around your hero portrait.</p></div></div>
        <div className="admin-chip-list">{content.floatingSkills.map((skill, index) => <div className="admin-chip-row" key={index}><label>Floating label {String(index + 1).padStart(2, '0')}<input value={skill} onChange={event => update('floatingSkills', content.floatingSkills.map((item, i) => i === index ? event.target.value : item))} /></label><button className="admin-remove" onClick={() => update('floatingSkills', content.floatingSkills.filter((_, i) => i !== index))} aria-label={`Remove floating skill ${skill}`}>×</button></div>)}</div>
        <button className="admin-add" onClick={() => update('floatingSkills', [...content.floatingSkills, 'New skill'])}>＋ Add floating skill</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>06</span><div><h2>Projects</h2><p>These entries appear in the selected work section.</p></div></div>
        <div className="admin-project-list">{content.projects.map((project, index) => <article className={`admin-project-editor${draggingProject === index ? ' is-dragging' : ''}`} key={index} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); reorderProjects(draggingProject, index); setDraggingProject(null); }}>
          <div className="admin-project-title"><span>PROJECT {String(index + 1).padStart(2, '0')}</span><div className="admin-project-actions"><button type="button" className="admin-project-drag-handle" draggable aria-label={`Drag to reorder ${project.name}`} title="Drag to reorder" onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); setDraggingProject(index); }} onDragEnd={() => setDraggingProject(null)}>⠿</button><button type="button" className="admin-remove" onClick={() => update('projects', content.projects.filter((_, i) => i !== index))} aria-label={`Remove ${project.name}`}>×</button></div></div>
          <div className="admin-form-grid"><label>Project number<input value={project.number || ''} onChange={event => updateProject(index, 'number', event.target.value)} /></label><label>Project name<input value={project.name} onChange={event => updateProject(index, 'name', event.target.value)} /></label><label>Category<input value={project.type} onChange={event => updateProject(index, 'type', event.target.value.toUpperCase())} placeholder="WEB APP" /></label><label>Card symbol<input value={project.icon || ''} onChange={event => updateProject(index, 'icon', event.target.value)} /></label><label className="admin-wide">Description<textarea rows="2" value={project.description} onChange={event => updateProject(index, 'description', event.target.value)} /></label><label>Project link<input type="url" value={project.url || ''} onChange={event => updateProject(index, 'url', event.target.value)} placeholder="https://" /></label><label>Card color<select value={project.tone} onChange={event => updateProject(index, 'tone', event.target.value)}><option value="sage">Sage</option><option value="clay">Clay</option><option value="blue">Blue</option></select></label></div>
          <div className="admin-project-tools"><p>Tools / skills <small>Drag the handle to change their order. Empty fields are ignored on the project card.</small></p>{(project.stack || []).map((tool, toolIndex) => { const isDragging = draggingProjectTool?.projectIndex === index && draggingProjectTool?.toolIndex === toolIndex; return <div className={`admin-chip-row${isDragging ? ' is-dragging' : ''}`} key={toolIndex} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggingProjectTool?.projectIndex === index) reorderProjectTools(index, draggingProjectTool.toolIndex, toolIndex); setDraggingProjectTool(null); }}><label>Tool {String(toolIndex + 1).padStart(2, '0')}<input value={tool} onChange={event => updateProjectTool(index, toolIndex, event.target.value)} /></label><div className="admin-tool-actions"><button type="button" className="admin-tool-drag-handle" draggable aria-label={`Drag to reorder ${tool || `tool ${toolIndex + 1}`}`} title="Drag to reorder" onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(toolIndex)); setDraggingProjectTool({ projectIndex: index, toolIndex }); }} onDragEnd={() => setDraggingProjectTool(null)}>⠿</button><button type="button" className="admin-remove" onClick={() => updateProject(index, 'stack', project.stack.filter((_, i) => i !== toolIndex))} aria-label={`Remove tool ${tool}`}>×</button></div></div>; })}<button type="button" className="admin-add" onClick={() => updateProject(index, 'stack', [...(project.stack || []), ''])}>＋ Add project tool / skill</button></div>
          <div className="admin-project-media"><p>Project images <small>Upload one or more images. Multiple images rotate automatically in the portfolio card.</small></p>{(project.images || []).length > 0 && <div className="admin-project-image-list">{project.images.map((image, imageIndex) => <div className="admin-project-image" key={`${imageIndex}-${image.slice(0, 32)}`}><img src={image} alt={`${project.name} preview ${imageIndex + 1}`} /><button type="button" className="admin-remove" onClick={() => updateProject(index, 'images', project.images.filter((_, i) => i !== imageIndex))} aria-label={`Remove image ${imageIndex + 1} from ${project.name}`}>×</button></div>)}</div>}<label className="admin-file-button">Add project images<input type="file" accept="image/*" multiple onChange={event => { handleProjectImages(index, event.target.files); event.target.value = ''; }} /></label></div>
        </article>)}</div>
        <button className="admin-add" onClick={() => update('projects', [...content.projects, { number: String(content.projects.length + 1).padStart(2, '0'), type: 'WEB APP', name: 'New project', description: '', stack: [], tone: 'sage', icon: '✳', url: '', images: [] }])}>＋ Add project</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>07</span><div><h2>Experience</h2><p>Edit the roles and learning milestones in your timeline.</p></div></div>
        <div className="admin-project-list">{content.experience.map((item, index) => <article className="admin-project-editor" key={index}><div className="admin-project-title"><span>EXPERIENCE {String(index + 1).padStart(2, '0')}</span><button className="admin-remove" onClick={() => update('experience', content.experience.filter((_, i) => i !== index))} aria-label={`Remove ${item.title}`}>×</button></div><div className="admin-form-grid"><label>Dates<input value={item.date} onChange={event => updateExperience(index, 'date', event.target.value)} placeholder="2024 — NOW" /></label><label>Role / title<input value={item.title} onChange={event => updateExperience(index, 'title', event.target.value)} placeholder="Role title" /></label><label>Company / context<input value={item.organization} onChange={event => updateExperience(index, 'organization', event.target.value)} placeholder="Company or project" /></label><label>Description<input value={item.description} onChange={event => updateExperience(index, 'description', event.target.value)} placeholder="What you worked on" /></label></div></article>)}</div>
        <button className="admin-add" onClick={() => update('experience', [...content.experience, { date: '', title: 'New role', organization: '', description: '' }])}>＋ Add experience</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>08</span><div><h2>Education</h2><p>Add your degrees, schools, dates, and optional notes.</p></div></div>
        <div className="admin-project-list">{content.education.map((item, index) => <article className="admin-project-editor" key={index}><div className="admin-project-title"><span>EDUCATION {String(index + 1).padStart(2, '0')}</span><button type="button" className="admin-remove" onClick={() => update('education', content.education.filter((_, i) => i !== index))} aria-label={`Remove ${item.degree || 'education entry'}`}>×</button></div><div className="admin-form-grid"><label>Dates<input value={item.date} onChange={event => updateEducation(index, 'date', event.target.value)} placeholder="2020 — 2024" /></label><label>Degree / program<input value={item.degree} onChange={event => updateEducation(index, 'degree', event.target.value)} placeholder="Bachelor's degree" /></label><label>School / institution<input value={item.institution} onChange={event => updateEducation(index, 'institution', event.target.value)} placeholder="University name" /></label><label>CGPA / GPA<input value={item.cgpa || ''} onChange={event => updateEducation(index, 'cgpa', event.target.value)} placeholder="3.8 / 4.0" /></label><label>Marks / percentage<input value={item.marks || ''} onChange={event => updateEducation(index, 'marks', event.target.value)} placeholder="850 / 1100 or 85%" /></label><label>Description (optional)<input value={item.description} onChange={event => updateEducation(index, 'description', event.target.value)} placeholder="Major, honors, or focus" /></label></div></article>)}</div>
        <button type="button" className="admin-add" onClick={() => update('education', [...content.education, { date: '', degree: '', institution: '', cgpa: '', marks: '', description: '' }])}>＋ Add education</button>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><span>09</span><div><h2>Website text</h2><p>Edit the headings, captions, buttons, and status text used throughout the site.</p></div></div>
        <div className="admin-copy-groups">{copyEditorGroups.map(group => <div className="admin-copy-group" key={group.title}><h3>{group.title}</h3><div className="admin-form-grid">{group.fields.map(([key, label, multiline]) => <label className={multiline ? 'admin-wide' : ''} key={key}>{label}{multiline ? <textarea rows="2" value={content.copy?.[key] ?? DEFAULT_CONTENT.copy[key]} onChange={event => updateCopy(key, event.target.value)} /> : <input value={content.copy?.[key] ?? DEFAULT_CONTENT.copy[key]} onChange={event => updateCopy(key, event.target.value)} />}</label>)}</div></div>)}</div>
      </section>

      <div className="admin-save-row">{notice && <p className={noticeError ? 'admin-notice error' : 'admin-notice'} role="status">{notice}</p>}<div><button className="admin-reset" onClick={reset}>Restore defaults</button><button className="admin-export" onClick={exportFiles}>Prepare export</button>{exportDownloadUrl && <a className="admin-export-download" href={exportDownloadUrl} download="portfolio-site-files.zip">Download ZIP ↓</a>}<button className="admin-save" onClick={save}>Save changes <span>↗</span></button></div></div>
    </main>
  </div>;
}
