import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight, ArrowUpRight, BellRing, CalendarCheck2, Check, CheckCircle2,
  ChevronDown, CircleHelp, ClipboardCheck, Clock3, FileCheck2, FileText,
  LayoutDashboard, LockKeyhole, Menu, RefreshCw, ShieldCheck, SlidersHorizontal,
  Sparkles, Wallet, Wrench, X,
} from 'lucide-react';

type FormState = {
  fullName: string;
  email: string;
  company: string;
  city: string;
  teamSize: string;
  challenge: string;
  consent: boolean;
  website: string;
  turnstileToken?: string;
};

const initial: FormState = {
  fullName: '', email: '', company: '', city: '', teamSize: '', challenge: '', consent: false, website: '',
};

type PublicConfig = { contactEmail: string; registrationEnabled: boolean; turnstileSiteKey: string };
const defaultConfig: PublicConfig = { contactEmail: '', registrationEnabled: false, turnstileSiteKey: '' };

const features = [
  { Icon: CalendarCheck2, label: 'Planification préventive', text: 'Une vision claire des visites à réaliser pour chaque contrat et chaque site.', tag: 'Évitez les oublis' },
  { Icon: ClipboardCheck, label: 'Interventions terrain', text: 'Checklists, commentaires et suivi des opérations effectuées par vos techniciens.', tag: 'Travail traçable' },
  { Icon: FileCheck2, label: 'Rapports professionnels', text: 'Centralisez les preuves d’intervention et préparez des comptes rendus partageables.', tag: 'Clients rassurés' },
  { Icon: BellRing, label: 'Échéances & renouvellements', text: 'Repérez les dates importantes de vos contrats sans parcourir vos fichiers Excel.', tag: 'Plus de visibilité' },
  { Icon: Wallet, label: 'Suivi de facturation', text: 'Identifiez les interventions réalisées et les contrats prêts à être facturés.', tag: 'Meilleur suivi' },
  { Icon: LayoutDashboard, label: 'Vue d’ensemble', text: 'Retrouvez vos contrats, sites et opérations dans un tableau de bord unique.', tag: 'Tout au même endroit' },
];

const faqs = [
  { q: 'MaintiFlow est-il déjà disponible ?', a: 'Pas encore. MaintiFlow est un projet en phase de validation. Nous recherchons des entreprises intéressées par un accès pilote et leurs retours nous aideront à définir les fonctions prioritaires.' },
  { q: 'À quelles entreprises s’adresse la solution ?', a: 'Principalement aux sociétés marocaines de maintenance CVC, froid industriel et maintenance multitechnique qui suivent plusieurs contrats et interventions récurrentes.' },
  { q: 'Combien coûtera MaintiFlow ?', a: 'Les formules affichées sont des hypothèses tarifaires, pas des offres commerciales fermes. Les conditions du pilote et les tarifs définitifs seront précisés avant tout engagement.' },
  { q: 'Dois-je payer pour demander un accès pilote ?', a: 'Non. La demande d’accès n’est pas un achat et ne crée aucun engagement. Un éventuel pilote payant ferait l’objet d’une proposition distincte.' },
];

function Logo() {
  return (
    <a className="brand" href="#accueil" aria-label="MaintiFlow — Retour à l’accueil">
      <span className="brand-mark" aria-hidden="true"><Wrench size={22} strokeWidth={2.8} /></span>
      <span className="brand-name">Mainti<span>Flow</span></span>
    </a>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-wrap" aria-label="Illustration d'un futur tableau de bord MaintiFlow">
      <div className="floating-note note-top"><span className="tiny-checked"><Check size={12} /></span><span>Rapport prêt à partager</span></div>
      <div className="dashboard">
        <div className="dashboard-sidebar">
          <span className="dash-mini-logo"><Wrench size={17}/></span>
          <div className="sidebar-icons"><span className="selected"><LayoutDashboard size={17}/></span><span><CalendarCheck2 size={17}/></span><span><FileText size={17}/></span><span><SlidersHorizontal size={17}/></span></div>
          <span className="sidebar-bottom"><CircleHelp size={17}/></span>
        </div>
        <div className="dashboard-body">
          <div className="dash-topbar"><span>Vue d’ensemble <ChevronDown size={13}/></span><span className="dash-profile">MF</span></div>
          <div className="dash-heading"><div><p className="dash-kicker">TABLEAU DE BORD</p><h3>Bonjour, Youssef <span aria-hidden="true">👋</span></h3><p>Voici un aperçu de votre activité.</p></div><span className="dash-calendar"><CalendarCheck2 size={13}/> Novembre 2026</span></div>
          <div className="dash-stats">
            <div className="dash-stat"><div><span>Contrats actifs</span><FileText size={16}/></div><strong>24</strong><small><span>↗ 3</span> ce mois</small></div>
            <div className="dash-stat"><div><span>Visites planifiées</span><CalendarCheck2 size={16}/></div><strong>18</strong><small>Sur les 30 prochains jours</small></div>
            <div className="dash-stat"><div><span>Rapports terminés</span><ClipboardCheck size={16}/></div><strong>42</strong><small><span>↗ 8</span> ce mois</small></div>
          </div>
          <div className="dash-panels">
            <div className="dash-activity"><div className="dash-panel-title"><strong>Interventions à venir</strong><span>Voir tout <ArrowUpRight size={11}/></span></div>
              <div className="dash-entry"><span className="entry-icon blue"><Wrench size={15}/></span><span className="entry-text"><strong>Maintenance climatisation</strong><small>Hôtel Atlas · Casablanca</small></span><span className="entry-date">18 nov.</span></div>
              <div className="dash-entry"><span className="entry-icon amber"><Wrench size={15}/></span><span className="entry-text"><strong>Contrôle groupe froid</strong><small>Frigo Sud · Mohammedia</small></span><span className="entry-date">20 nov.</span></div>
              <div className="dash-entry"><span className="entry-icon mint"><Wrench size={15}/></span><span className="entry-text"><strong>Visite préventive CVC</strong><small>Résidence Horizon · Rabat</small></span><span className="entry-date">24 nov.</span></div>
            </div>
            <div className="dash-chart"><div className="dash-panel-title"><strong>Activité</strong><span>6 mois</span></div><div className="chart-bars" aria-hidden="true">{[46,63,51,81,66,93].map((v,i)=><div key={i}><span style={{height:`${v}%`}} className={i===5?'hot':''}/></div>)}</div><div className="chart-months"><span>Jui.</span><span>Jul.</span><span>Aoû.</span><span>Sep.</span><span>Oct.</span><span>Nov.</span></div></div>
          </div>
        </div>
      </div>
      <div className="floating-note note-bottom"><span className="note-icon"><ShieldCheck size={17}/></span><span><b>Contrats suivis</b><small>Tout au même endroit</small></span></div>
      <div className="preview-disclaimer">Aperçu illustratif · Données fictives</div>
    </div>
  );
}


type TurnstileApi = {
  render(element: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }): string;
  remove(id: string): void;
};

function TurnstileChallenge({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let widgetId: string | undefined;
    const turnstile = () => (window as Window & { turnstile?: TurnstileApi }).turnstile;
    const render = () => {
      if (disposed || !target.current || !turnstile() || widgetId) return;
      widgetId = turnstile()!.render(target.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-maintiflow-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.setAttribute('data-maintiflow-turnstile', '');
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    render();
    return () => {
      disposed = true;
      script?.removeEventListener('load', render);
      if (widgetId && turnstile()) turnstile()!.remove(widgetId);
    };
  }, [siteKey, onToken]);
  return <div className="turnstile-row"><div ref={target}/><p>Vérification de sécurité avant l’envoi.</p></div>;
}

function EarlyAccessForm({ canCollect, turnstileSiteKey }: { canCollect: boolean; turnstileSiteKey: string }) {
  const [values, setValues] = useState<FormState>(initial);
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  function change<K extends keyof FormState>(field: K, value: FormState[K]) {
    setValues(prev => ({...prev, [field]: value}));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCollect || (turnstileSiteKey && !turnstileToken)) return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      const result = await response.json() as {ok?: boolean; message?: string};
      if (!response.ok || !result.ok) throw new Error(result.message || 'Impossible de transmettre votre demande.');
      setStatus('success');
      setValues(initial);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Erreur inattendue. Veuillez réessayer.');
    } finally {
      if (turnstileSiteKey) {
        setTurnstileToken('');
        setTurnstileReset(v => v + 1);
      }
    }
  }

  return (
    <div className="form-card" id="inscription">
      <div className="form-head"><span className="form-icon"><Sparkles size={19}/></span><div><h3>Demandez un accès pilote</h3><p>Sans engagement, en moins d’une minute.</p></div></div>
      {status === 'success' ? (
        <div className="success-state" role="status"><CheckCircle2 size={40}/><h4>Demande bien reçue !</h4><p>Merci pour votre intérêt. Nous reviendrons vers vous par email si votre profil correspond au programme pilote.</p><button className="secondary-reset" onClick={()=>setStatus('idle')}>Envoyer une autre demande</button></div>
      ) : (
        <form onSubmit={submit}>
          <div className="field-grid">
            <label>Votre nom <span>*</span><input required minLength={2} maxLength={90} name="fullName" placeholder="Ex. Youssef El Amrani" autoComplete="name" value={values.fullName} onChange={e=>change('fullName',e.target.value)}/></label>
            <label>Email professionnel <span>*</span><input required maxLength={254} type="email" name="email" placeholder="vous@entreprise.ma" autoComplete="email" value={values.email} onChange={e=>change('email',e.target.value)}/></label>
            <label>Nom de l'entreprise <span>*</span><input required minLength={2} maxLength={120} name="company" placeholder="Votre société" autoComplete="organization" value={values.company} onChange={e=>change('company',e.target.value)}/></label>
            <label>Ville <span>*</span><input required minLength={2} maxLength={80} name="city" placeholder="Ex. Casablanca" autoComplete="address-level2" value={values.city} onChange={e=>change('city',e.target.value)}/></label>
            <label>Taille de votre équipe <span>*</span><select required name="teamSize" value={values.teamSize} onChange={e=>change('teamSize',e.target.value)}><option value="">Sélectionner</option><option value="1-5">1 à 5 personnes</option><option value="6-20">6 à 20 personnes</option><option value="21-50">21 à 50 personnes</option><option value="51+">Plus de 50 personnes</option></select></label>
            <label>Votre principal défi <span>*</span><select required name="challenge" value={values.challenge} onChange={e=>change('challenge',e.target.value)}><option value="">Sélectionner</option><option value="planning">Planifier les visites</option><option value="contracts">Suivre les contrats</option><option value="reports">Préparer les rapports</option><option value="billing">Suivre la facturation</option><option value="other">Autre</option></select></label>
          </div>
          <div className="honey" aria-hidden="true"><label>Votre site web<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={e=>change('website',e.target.value)}/></label></div>
          {canCollect && turnstileSiteKey && <TurnstileChallenge key={turnstileReset} siteKey={turnstileSiteKey} onToken={setTurnstileToken}/>}
          <label className="consent"><input type="checkbox" required checked={values.consent} onChange={e=>change('consent',e.target.checked)}/><span>J’accepte que mes données soient utilisées uniquement pour traiter ma demande d’accès pilote. <a href="#confidentialite">En savoir plus</a>.</span></label>
          {!canCollect && <div className="form-unavailable" role="status">Les demandes sont temporairement suspendues pendant la finalisation de nos formalités de protection des données. Pour toute question : maintiflow.contact@gmail.com.</div>}
          {status === 'error' && <div className="form-error" role="alert">{message}</div>}
          <button type="submit" className="btn btn-primary btn-submit" disabled={status==='sending'||!canCollect||(Boolean(turnstileSiteKey)&&!turnstileToken)}>{status==='sending'?'Envoi en cours…':'Demander mon accès pilote'} <ArrowRight size={17}/></button>
          <p className="form-fine"><LockKeyhole size={13}/> Pas de paiement. Aucun démarchage téléphonique. Réponse par email uniquement.</p>
        </form>
      )}
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<PublicConfig>(defaultConfig);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/config', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Configuration unavailable');
        return response.json() as Promise<PublicConfig>;
      })
      .then(data => {
        if (!controller.signal.aborted && typeof data.contactEmail === 'string') {
          setConfig({ contactEmail: data.contactEmail, registrationEnabled: data.registrationEnabled === true, turnstileSiteKey: typeof data.turnstileSiteKey === 'string' ? data.turnstileSiteKey : '' });
        }
      })
      .catch(() => { /* Fail closed: do not accept registrations without backend configuration. */ });
    return () => controller.abort();
  }, []);
  const contactEmail = config.contactEmail;
  const canCollect = config.registrationEnabled && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);

  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="site-shell" id="accueil">
        <header className="site-header container">
          <Logo />
          <nav className={`nav-links ${menuOpen?'open':''}`} aria-label="Navigation principale">
            <a href="#fonctionnalites" onClick={()=>setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#comment-ca-marche" onClick={()=>setMenuOpen(false)}>Comment ça marche</a>
            <a href="#tarifs" onClick={()=>setMenuOpen(false)}>Tarifs envisagés</a>
            <a href="#faq" onClick={()=>setMenuOpen(false)}>FAQ</a>
          </nav>
          <a className="btn btn-outline header-cta" href="#inscription">Accès pilote <ArrowUpRight size={16}/></a>
          <button className="mobile-menu" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?'Fermer le menu':'Ouvrir le menu'} aria-expanded={menuOpen}>{menuOpen?<X size={24}/>:<Menu size={24}/>}</button>
        </header>

        <main>
          <section className="hero container" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="pill"><span className="pulse-dot"/> Conçu pour les équipes de maintenance au Maroc <span className="pill-end">↗</span></div>
              <h1 id="hero-title">Vos contrats de maintenance, <em>enfin sous contrôle.</em></h1>
              <p className="hero-lead">Moins de fichiers dispersés. Plus de visibilité sur vos contrats, vos interventions et vos rapports clients.</p>
              <div className="hero-actions"><a className="btn btn-primary" href="#inscription">Demander un accès pilote <ArrowRight size={18}/></a><a className="btn btn-text" href="#comment-ca-marche">Découvrir le concept <ArrowUpRight size={17}/></a></div>
              <div className="hero-proof"><span className="hero-check"><Check size={14}/></span> Projet en phase de validation <span className="hero-separator"/> <span>Sans engagement</span></div>
            </div>
            <DashboardPreview />
          </section>

          <div className="sector-strip"><div className="container sector-inner"><span>UN OUTIL PENSÉ POUR</span><div><span>❋</span> Maintenance CVC</div><div><span>❋</span> Froid industriel</div><div><span>❋</span> Services multitechniques</div><div><span>❋</span> Contrats récurrents</div></div></div>

          <section className="pain-section section-pad" aria-labelledby="pain-title">
            <div className="container"><div className="section-heading center"><span className="eyebrow">LE CONSTAT</span><h2 id="pain-title">Le problème n’est pas le terrain.<br/><span>C’est tout ce qu’il faut suivre autour.</span></h2><p>Les entreprises de maintenance jonglent souvent entre plusieurs outils pour gérer une seule activité.</p></div>
              <div className="pain-grid">
                <article><div className="pain-num">01</div><div className="pain-line"/><h3>Des informations éparpillées</h3><p>Contrats sur Excel, photos sur WhatsApp, rapports stockés dans différents dossiers.</p></article>
                <article><div className="pain-num">02</div><div className="pain-line"/><h3>Des échéances difficiles à suivre</h3><p>Visites préventives, interventions en cours et dates de renouvellement à surveiller.</p></article>
                <article><div className="pain-num">03</div><div className="pain-line"/><h3>Une facturation déconnectée du terrain</h3><p>Retrouver la preuve du travail effectué devient une tâche supplémentaire.</p></article>
              </div>
            </div>
          </section>

          <section className="features-section section-pad" id="fonctionnalites" aria-labelledby="features-title">
            <div className="container"><div className="features-intro"><div><span className="eyebrow">LE CONCEPT MAINTIFLOW</span><h2 id="features-title">Un seul espace pour garder <span>le fil.</span></h2></div><p>Une solution en préparation, conçue pour relier le bureau, les techniciens et les engagements clients.</p></div>
              <div className="feature-grid">{features.map(({Icon,label,text,tag})=><article className="feature-card" key={label}><div className="feature-icon"><Icon size={22} strokeWidth={1.9}/></div><h3>{label}</h3><p>{text}</p><span className="feature-tag"><Check size={13}/>{tag}</span></article>)}</div>
              <div className="features-note"><Sparkles size={17}/><span>Ces fonctionnalités sont envisagées pour le produit. Leur disponibilité sera déterminée avec les premières entreprises pilotes.</span></div>
            </div>
          </section>

          <section className="process-section section-pad" id="comment-ca-marche" aria-labelledby="process-title"><div className="container"><div className="section-heading"><span className="eyebrow">SIMPLE, DU CONTRAT AU RAPPORT</span><h2 id="process-title">Une meilleure continuité,<br/><span>du bureau au terrain.</span></h2></div><div className="steps-grid">
              <div className="step-card"><div className="step-number">01 <span>→</span></div><div className="step-symbol"><FileText size={27}/></div><h3>Enregistrez vos contrats</h3><p>Sites, équipements, prestations prévues et calendrier de maintenance.</p></div>
              <div className="step-card"><div className="step-number">02 <span>→</span></div><div className="step-symbol"><Clock3 size={27}/></div><h3>Suivez les interventions</h3><p>Visites à réaliser, avancement et retours des équipes terrain.</p></div>
              <div className="step-card"><div className="step-number">03 <span>↗</span></div><div className="step-symbol"><CheckCircle2 size={27}/></div><h3>Retrouvez vos justificatifs</h3><p>Informations de chaque intervention, rapports clients et statut de facturation.</p></div>
            </div></div></section>

          <section className="pricing-section section-pad" id="tarifs" aria-labelledby="pricing-title"><div className="container"><div className="section-heading center"><span className="eyebrow">TRANSPARENCE DÈS LE DÉPART</span><h2 id="pricing-title">Des tarifs pensés pour<br/><span>les entreprises marocaines.</span></h2><p>Hypothèses tarifaires en cours de validation. Aucun paiement n’est demandé pour manifester votre intérêt.</p></div>
            <div className="pricing-grid"><article className="price-card"><div className="price-top"><span>STARTER</span><Wrench size={19}/></div><h3>Pour structurer vos opérations.</h3><div className="price"><strong>699 DH</strong><span>/ mois</span></div><p className="price-sub">Tarif envisagé · jusqu’à 5 techniciens</p><ul><li><Check size={17}/> Contrats et sites clients</li><li><Check size={17}/> Calendrier des interventions</li><li><Check size={17}/> Suivi et rapports</li></ul><a className="btn price-btn" href="#inscription">Je suis intéressé <ArrowRight size={16}/></a></article>
              <article className="price-card featured"><div className="price-top"><span>BUSINESS</span><span className="price-badge">Pour les équipes en croissance</span></div><h3>Pour piloter plusieurs contrats.</h3><div className="price"><strong>1 199 DH</strong><span>/ mois</span></div><p className="price-sub">Tarif envisagé · jusqu’à 20 techniciens</p><ul><li><Check size={17}/> Tout Starter</li><li><Check size={17}/> Suivi des échéances</li><li><Check size={17}/> Vision par contrat et par site</li></ul><a className="btn btn-primary price-btn" href="#inscription">Demander un accès pilote <ArrowRight size={16}/></a></article></div>
          </div></section>

          <section className="waitlist-section section-pad" aria-labelledby="waitlist-title"><div className="container waitlist-grid"><div className="waitlist-copy"><span className="eyebrow light">PREMIÈRES ENTREPRISES PILOTES</span><h2 id="waitlist-title">Construisons un outil qui <em>répond à votre réalité.</em></h2><p>MaintiFlow est encore au stade de validation. Votre retour peut influencer les premières fonctions et vous permettre de découvrir le produit en avant-première.</p><div className="waitlist-points"><div><span><Check size={17}/></span> Un échange par email, sans appel imprévu</div><div><span><Check size={17}/></span> Pas d’engagement ni de paiement à l’inscription</div><div><span><Check size={17}/></span> Un produit à construire avec les professionnels du secteur</div></div><div className="waitlist-decor"><RefreshCw size={26}/><span>Du contrat au terrain, et retour.</span></div></div><EarlyAccessForm canCollect={canCollect} turnstileSiteKey={config.turnstileSiteKey} /></div></section>

          <section className="faq-section section-pad" id="faq" aria-labelledby="faq-title"><div className="container faq-grid"><div><span className="eyebrow">QUESTIONS FRÉQUENTES</span><h2 id="faq-title">L’essentiel,<br/><span>sans détour.</span></h2><p>Tout ce qu’il faut savoir sur ce projet en cours de validation.</p></div><div className="faq-list">{faqs.map(({q,a})=><details key={q}><summary>{q}<span><ChevronDown size={19}/></span></summary><p>{a}</p></details>)}</div></div></section>
        </main>
        <footer className="footer" id="confidentialite"><div className="container"><div className="footer-row"><Logo/><span>La maintenance mérite mieux que des fichiers éparpillés.</span><a href="#accueil">Haut de page ↑</a></div><div className="privacy"><h3>Confidentialité & données personnelles</h3>{!canCollect && <p><strong>Les nouvelles inscriptions sont temporairement suspendues pendant notre revue de conformité.</strong></p>}<p>MaintiFlow est un projet en phase de validation au Maroc. Les données du formulaire (nom, email, entreprise, ville, taille d’équipe, principal défi) sont collectées uniquement pour étudier votre demande d’accès pilote et vous répondre. Pas de revente ni d’inscription automatique à une newsletter.</p><p>Les demandes sont enregistrées sur Cloudflare D1 et conservées au maximum 180 jours, avec une suppression automatique quotidienne prévue. Les alertes email, lorsqu’elles sont activées, ne contiennent que la référence de l’inscription, sans coordonnées personnelles. La conservation et l’accès restent soumis aux obligations légales applicables.</p><p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données en contactant {canCollect?<a href={`mailto:${contactEmail}`}>{contactEmail}</a>:<strong>l’adresse de contact à configurer avant ouverture des inscriptions</strong>}. Une vérification raisonnable de votre identité peut être demandée. L’identité légale du responsable du traitement et les formalités CNDP applicables doivent être finalisées avant toute campagne commerciale.</p><p>MaintiFlow est un nom de projet. Ce site présente une solution en préparation, pas un service déjà commercialisé.</p></div><div className="footer-bottom"><span>© {new Date().getFullYear()} MaintiFlow — Projet en validation au Maroc.</span><span>Fait pour les équipes qui font avancer le terrain.</span></div></div></footer>
      </div>
    </>
  );
}
