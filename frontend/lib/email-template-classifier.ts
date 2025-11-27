/**
 * Email Template Classifier for Property Management
 * 
 * Classifies emails into pre-built templates:
 * - WATER DAMAGE INCIDENT
 * - EVICTION REQUEST
 * - RENOVATION REQUEST
 * - REGULATION VIOLATION
 * - PURCHASE REQUEST
 * - VENDOR PAYMENT REQUEST
 * - BANKING REQUEST
 * - OPERATIONS TASK
 * - NOTARY DOCUMENT ANSWER
 * - CUSTOMER REQUEST
 * - WORK NEEDING TO BE DONE IN THE BUILDING
 * - THINGS TO BE DONE IN THE COMING WEEKS
 * - MENSUAL REPORT
 * - FINANCIAL REPORT
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number; // Higher = more urgent
}

export interface EmailClassification {
  template: EmailTemplate;
  confidence: number;
  reasoning: string;
  extractedEntities: {
    dates?: string[];
    amounts?: string[];
    locations?: string[];
    people?: string[];
    documents?: string[];
    phoneNumbers?: string[];
  };
}

export interface FewShotExample {
  email: string;
  template: string;
  entities: Record<string, any>;
  confidence: number;
  userId?: string;
}

// Pre-built templates
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'meeting-request',
    name: 'MEETING REQUEST',
    description: 'Emails requesting meetings, scheduling appointments, or coordinating availability',
    keywords: ['meeting', 'schedule', 'appointment', 'available', 'availability', 'coordinate', 'réunion', 'disponible', 'horaire'],
    patterns: [
      /\b(meeting|schedule|appointment|coordinate|available|availability)\b/gi,
      /\b(réunion|disponible|horaire)\b/gi,
      /\b(when.*available|schedule.*meeting|set up.*meeting)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*\d{1,2}:\d{2}\b/gi
    ],
    priority: 7
  },
  {
    id: 'schedule-request',
    name: 'SCHEDULE REQUEST',
    description: 'Requests for schedules, timetables, shift information, or guard schedules',
    keywords: ['schedule', 'shift', 'timetable', 'horaire', 'schedule', 'guards', 'security', 'shifts'],
    patterns: [
      /\b(schedule|shift|timetable|horaire)\b/gi,
      /\b(guard.*schedule|security.*schedule|shift.*times?)\b/gi,
      /\b(current.*week|week.*schedule)\b/gi,
      /\b(assigned.*times?|shift.*timings?)\b/gi
    ],
    priority: 7
  },
  {
    id: 'report-request',
    name: 'REPORT REQUEST',
    description: 'Requests for reports, missing reports, or report-related inquiries',
    keywords: ['report', 'reports', 'missing', 'rapport', 'rapports', 'weekend', 'night', 'shift'],
    patterns: [
      /\b(report|reports|rapport|rapports)\b/gi,
      /\b(missing.*report|not.*receiving.*report|weekend.*report)\b/gi,
      /\b(night.*report|shift.*report|midnight.*report)\b/gi,
      /\b(remove.*report|stop.*report)\b/gi
    ],
    priority: 8
  },
  {
    id: 'protocol-discussion',
    name: 'PROTOCOL DISCUSSION',
    description: 'Discussions about protocols, procedures, rules, regulations, or training',
    keywords: ['protocol', 'procedure', 'rules', 'regulations', 'training', 'protocol', 'procédure', 'règles'],
    patterns: [
      /\b(protocol|procedure|rules|regulations|training)\b/gi,
      /\b(protocol|procédure|règles)\b/gi,
      /\b(review.*rules|discuss.*protocol|enforce.*protocol)\b/gi,
      /\b(cell phone.*usage|rounds|move-in|move-out)\b/gi
    ],
    priority: 8
  },
  {
    id: 'legal-document-request',
    name: 'LEGAL DOCUMENT REQUEST',
    description: 'Requests for legal documents, certificates, attestations, or official condominium documents (Law 16, certificates, etc.)',
    keywords: [
      'law 16', 'loi 16', 'attestation', 'certificate', 'certificat', 
      'legal document', 'condominium certificate', 'co-ownership', 
      'declaration', 'administrative fees', 'notary', 'notaire',
      'certificat de copropriété', 'syndicate certificate',
      'numéro de matricule', 'registration number', 'registraire',
      'fonds de prévoyance', 'reserve fund', 'fonds d\'auto-assurance',
      'self-insurance fund', 'poursuites judiciaires', 'legal proceedings',
      'réparations', 'rénovations', 'major repairs', 'insurance broker',
      'courtier d\'assurance', 'police d\'assurance', 'insurance policy',
      'franchise', 'deductible', 'lot number', 'numéro de lot',
      'condo fees', 'frais de condo', 'next payment', 'prochain paiement',
      'amount due', 'montant dû'
    ],
    patterns: [
      /\b(law\s*16|loi\s*16)\b/gi,
      /\b(attestation|certificate|certificat)\b/gi,
      /\b(condominium.*certificate|co-ownership.*certificate|certificat.*copropriété)\b/gi,
      /\b(administrative.*fee|fee.*\$225|\$225|frais.*administratif)\b/gi,
      /\b(declaration.*co-ownership|section\s*\d+\.\d+\.\d+)\b/gi,
      /\b(sell.*unit|selling.*unit|transfer.*co-owner|vente.*unité)\b/gi,
      /\b(notary|notaire).*(document|certificate|certificat|request|demande)\b/gi,
      /\b(numéro.*matricule|registration.*number|registraire.*entreprises)\b/gi,
      /\b(fonds.*prévoyance|reserve.*fund|fonds.*auto-assurance|self-insurance)\b/gi,
      /\b(poursuites.*judiciaires|legal.*proceedings|lawsuit)\b/gi,
      /\b(courtier.*assurance|insurance.*broker|police.*assurance|insurance.*policy)\b/gi,
      /\b(franchise|deductible|montant.*franchise)\b/gi,
      /\b(lot.*number|numéro.*lot|unit.*number|unité)\b/gi,
      /\b(condo.*fees|frais.*condo|next.*payment|prochain.*paiement|amount.*due|montant.*dû)\b/gi
    ],
    priority: 9
  },
  {
    id: 'notary-document',
    name: 'NOTARY DOCUMENT ANSWER',
    description: 'Emails related to notary documents, legal paperwork, or official document requests',
    keywords: ['notary', 'notarized', 'document', 'legal', 'signature', 'witness', 'certified', 'affidavit', 'power of attorney'],
    patterns: [
      /\b(notary|notarized|notarize)\b/gi,
      /\b(document|paperwork|legal document)\b/gi,
      /\b(signature|witness|certified)\b/gi,
      /\b(affidavit|power of attorney|deed)\b/gi
    ],
    priority: 8
  },
  {
    id: 'water-damage-incident',
    name: 'WATER DAMAGE INCIDENT',
    description: 'Water damage incidents, insurance claims, emergency interventions, reconstruction work, repair follow-ups, or water-related property damage',
    keywords: ['water damage', 'dégât d\'eau', 'dégât d\'eaux', 'sinistre', 'water leak', 'flood', 'inondation', 'flooding', 'burst pipe', 'pipe burst', 'plumbing leak', 'roof leak', 'ceiling leak', 'insurance claim', 'déclaration de sinistre', 'assurance', 'emergency', 'urgence', 'reconstruction', 'repair', 'réparation', 'réparations', 'drying', 'assèchement', 'deductible', 'franchise', 'expert', 'évaluateur', 'compagnie d\'urgence', 'emergency company', 'after-sinister', 'après-sinistre', 'affected units', 'unités affectées', 'monday.com', 'water damage incident', 'plancher', 'floor', 'mur', 'wall', 'plombier', 'plumber'],
    patterns: [
      /\b(water.*damage|dégât.*d\'eau|dégât.*d\'eaux|dégât.*eau)\b/gi,
      /\b(actual.*water.*damage|dégât.*eau.*réel|sinistre.*eau.*survenu)\b/gi, // Actual damage, not preventive
      /\b(sinistre.*eau|sinistre.*water|water.*sinistre)\b/gi,
      /\b(water.*leak|leak.*water|fuite.*eau|fuite.*water|origine.*fuite)\b/gi,
      /\b(flood|flooding|inondation|inondé)\b/gi,
      /\b(burst.*pipe|pipe.*burst|tuyau.*éclaté|tuyau.*cassé)\b/gi,
      /\b(roof.*leak|ceiling.*leak|plafond.*fuite|toit.*fuite)\b/gi,
      /\b(insurance.*claim|déclaration.*sinistre|claim.*insurance|assurance.*syndicat)\b/gi,
      /\b(emergency.*company|compagnie.*urgence|après.*sinistre|after.*sinister)\b/gi,
      /\b(reconstruction|repair|réparation|réparations|drying|assèchement|nettoyage.*sinistre)\b/gi,
      /\b(deductible|franchise|expert.*sinistre|évaluateur)\b/gi,
      /\b(affected.*units|unités.*affectées|units.*affected)\b/gi,
      /\b(origin.*unit|unité.*origine|source.*sinistre|origine.*fuite)\b/gi,
      /\b(water.*incident|incident.*water|monday\.com.*water)\b/gi,
      /\b(PM.*contact|chef.*projet|project.*manager).*(water|sinistre|damage)\b/gi,
      /\b(compagnie.*reconstruction|reconstruction.*company)\b/gi,
      /\b(plancher.*réparer|floor.*repair|mur.*réparer|wall.*repair|planchers.*endommagés|floors.*damaged)\b/gi,
      /\b(plombier.*syndicat|syndicate.*plumber|intervention.*plombier|plumber.*intervention)\b/gi,
      /\b(responsabilité.*syndicat|syndicate.*responsibility|syndicat.*responsable)\b/gi,
      /\b(dossier.*réparations|repair.*file|follow.*up.*repair|relancer.*dossier)\b/gi,
      /\b(photos.*plancher|photos.*mur|photos.*damage|photos.*sinistre)\b/gi
    ],
    priority: 10 // Highest priority - urgent property damage
  },
  {
    id: 'tenant-safety-complaint',
    name: 'TENANT SAFETY COMPLAINT',
    description: 'Urgent tenant complaints about safety, security, disturbances, eviction requests, or police involvement',
    keywords: ['safety', 'security', 'tenant', 'complaint', 'eviction', 'expulsion', 'police', 'disturbance', 'pepper spray', 'unsafe', 'fear', 'TAL', 'tribunal', 'locataire', 'sécurité'],
    patterns: [
      /\b(safety|security|sécurité|unsafe|fear|afraid|scared|pepper spray)\b/gi,
      /\b(tenant|locataire|co-owner|co-propriétaire).*complaint\b/gi,
      /\b(eviction|expulsion|expulsé|TAL|tribunal administratif)\b/gi,
      /\b(police|authorities|plaintes officielles|complaint.*police)\b/gi,
      /\b(disturbance|disturb|disrupt|noise|yelling|fighting|racial)\b/gi,
      /\b(not.*safe|feel.*safe|safety.*concern|security.*issue)\b/gi,
      /\b(unit.*\d{4}|apartment.*\d{4})\b/gi, // Unit numbers in complaints
      /\b(immediately|asap|urgent|serious|severe)\b/gi
    ],
    priority: 10 // Highest priority - safety issues
  },
  {
    id: 'move-in-out-request',
    name: 'MOVE-IN/MOVE-OUT REQUEST',
    description: 'Move-in/move-out requests, moving fees, elevator reservations, fob requests, new resident setup, or moving deposits',
    keywords: ['move-in', 'move-out', 'moving', 'déménagement', 'emménagement', 'elevator reservation', 'fob', 'puce', 'chip', 'deed of sale', 'acte de vente', 'possession', 'new resident', 'nouveau résident', 'dépôt de déménagement', 'moving deposit', 'dépôt de garantie', 'damage deposit', 'état des lieux', 'inspection', 'ascenseur réservé', 'ascenseur de service'],
    patterns: [
      /\b(move-in|move-out|moving|déménagement|emménagement)\b/gi,
      /\b(elevator.*reservation|réservation.*ascenseur|moving.*day|jour.*déménagement|ascenseur.*réservé|ascenseur.*service)\b/gi,
      /\b(moving.*fee|frais.*déménagement|\$250.*move|supervision.*fee)\b/gi,
      /\b(deed.*sale|acte.*vente|possession|signing.*notary)\b/gi,
      /\b(new.*resident|nouveau.*résident|fob.*request|puce|chip.*request)\b/gi,
      /\b(monday.*saturday|8.*am.*6.*pm|lundi.*samedi|15.*days.*advance)\b/gi,
      /\b(furniture.*delivery|large.*piece|bed.*delivery|appliance.*contact)\b/gi,
      /\b(dépôt.*déménagement|moving.*deposit|dépôt.*garantie|damage.*deposit)\b/gi,
      /\b(état.*lieux|inspection.*déménagement|dommage.*constaté|damage.*constaté)\b/gi,
      /\b(protection.*parties.*communes|protect.*common.*areas|corridors|ascenseurs)\b/gi
    ],
    priority: 8
  },
  {
    id: 'renovation-request',
    name: 'RENOVATION REQUEST',
    description: 'Renovation requests, unit modifications, construction projects, renovation approvals, or building modification requests',
    keywords: ['renovation', 'rénovation', 'modification', 'renovate', 'construction', 'remodel', 'renovation request', 'demande de rénovation', 'modifications d\'unités', 'unit modifications', 'renovation project', 'projet de rénovation', 'approval', 'approbation', 'dépôt de garantie', 'deposit', 'guarantee deposit', 'permits', 'permis', 'municipal permit', 'permis municipal', 'contractor', 'entrepreneur', 'insurance', 'assurance', 'plans', 'plans détaillés', 'detailed plans', 'conseil d\'administration', 'board approval', 'CA'],
    patterns: [
      /\b(renovation|rénovation|renovate|remodel|modification)\b/gi,
      /\b(demande.*rénovation|renovation.*request|modifications.*unités|unit.*modifications)\b/gi,
      /\b(projet.*rénovation|renovation.*project|construction.*project)\b/gi,
      /\b(approval|approbation|conseil.*administration|board.*approval|CA.*approval)\b/gi,
      /\b(dépôt.*garantie|deposit|guarantee.*deposit|remboursable)\b/gi,
      /\b(permits|permis|municipal.*permit|permis.*municipal)\b/gi,
      /\b(contractor|entrepreneur|builder|construction.*company)\b/gi,
      /\b(insurance.*contractor|assurance.*entrepreneur|proof.*insurance|preuve.*assurance)\b/gi,
      /\b(plans.*détaillés|detailed.*plans|architectural.*plans|engineering.*plans)\b/gi,
      /\b(inspection.*post.*travaux|post.*work.*inspection|conformity|conformité)\b/gi,
      /\b(dates.*clés|key.*dates|début.*travaux|fin.*travaux|start.*date|end.*date)\b/gi,
      /\b(monday\.com.*rénovation|renovation.*dossier|renovation.*file)\b/gi
    ],
    priority: 8
  },
  {
    id: 'regulation-violation',
    name: 'REGULATION VIOLATION',
    description: 'Regulation violations, bylaw infractions, rule violations, warnings, fines, or compliance issues',
    keywords: ['violation', 'infraction', 'règlement', 'regulation', 'bylaw', 'non-compliance', 'non-conformité', 'warning', 'avertissement', 'fine', 'amende', 'penalty', 'pénalité', 'infraction aux règlements', 'regulation violation', 'rule violation', 'violation des règles', 'noise', 'bruit', 'excessive noise', 'bruit excessif', 'parking violation', 'stationnement illégal', 'unauthorized', 'non autorisé', 'animal', 'animaux', 'pet violation', 'violation animal', 'smoking', 'smoke', 'fumer', 'tabac', 'cigarette', 'caught', 'attrapé', 'security', 'sécurité'],
    patterns: [
      /\b(violation|infraction|non.*compliance|non.*conformité)\b/gi,
      /\b(règlement|regulation|bylaw|rule.*violation|violation.*règlement)\b/gi,
      /\b(infraction.*règlements|regulation.*violation|bylaw.*violation)\b/gi,
      /\b(warning|avertissement|première.*infraction|first.*violation)\b/gi,
      /\b(fine|amende|penalty|pénalité|montant.*amende)\b/gi,
      /\b(noise|bruit|excessive.*noise|bruit.*excessif|disturbance)\b/gi,
      /\b(parking.*violation|stationnement.*illégal|unauthorized.*parking)\b/gi,
      /\b(animal|animaux|pet.*violation|unauthorized.*animal|animal.*non.*autorisé)\b/gi,
      /\b(measures.*correctives|corrective.*measures|remedy|remédier)\b/gi,
      /\b(recidive|récidive|repeat.*violation|second.*violation)\b/gi,
      /\b(monday\.com.*infraction|violation.*dossier|infraction.*file|dossier.*\d+)\b/gi,
      /\b(preuves|evidence|photos|videos|témoignages|witnesses)\b/gi,
      /\b(statut.*paiement|payment.*status|amende.*payée|fine.*paid)\b/gi,
      /\b(100.*\$|150.*\$|50.*\$.*jour|pénalité.*supplémentaire)\b/gi, // Fine amounts
      /\b(smoking|smoke|fumer|tabac|cigarette).*(unit|unité|inside|dans)\b/gi,
      /\b(caught.*smoking|attrapé.*fumer|smoking.*caught|fumer.*attrapé)\b/gi,
      /\b(security.*caught|sécurité.*attrapé|caught.*security|attrapé.*sécurité)\b/gi,
      /\b(unit.*\d{3,4}.*smoking|smoking.*unit.*\d{3,4}|fumer.*unité.*\d{3,4})\b/gi,
      /\b(last.*night|hier.*soir|yesterday).*(smoking|smoke|fumer|caught|attrapé)\b/gi
    ],
    priority: 8
  },
  {
    id: 'board-meeting-followup',
    name: 'BOARD MEETING FOLLOW-UP',
    description: 'Board meeting follow-ups, action items, task lists, legal case updates, or administrative follow-up requests',
    keywords: ['board meeting', 'follow-up', 'follow up', 'action items', 'tasks', 'meeting minutes', 'procès-verbal', 'board', 'conseil', 'syndicate', 'syndicat', 'update', 'status', 'timeline', 'lawsuit', 'legal action', 'law firm', 'dossier', 'file'],
    patterns: [
      /\b(board meeting|meeting minutes|procès-verbal|follow-up|follow up)\b/gi,
      /\b(action items?|tasks?|tâches?|items?)\b/gi,
      /\b(board|conseil|syndicate|syndicat).*(meeting|follow-up|update)\b/gi,
      /\b(update.*asap|status.*update|timeline|deadline)\b/gi,
      /\b(please.*confirm|please.*provide|please.*obtain|please.*schedule)\b/gi,
      /\b(numbered.*list|\d+\.\s+[A-Z]|item\s+\d+)\b/gi, // Numbered action items
      /\b(lawsuit|legal action|law firm|dossier|file.*follow-up|follow-up.*file)\b/gi,
      /\b(regarding.*file|concernant.*dossier|suivi.*dossier)\b/gi,
      /\b(legal.*options|legal action|amicable.*settlement|corrective.*measures)\b/gi
    ],
    priority: 9
  },
  {
    id: 'access-control-request',
    name: 'ACCESS CONTROL REQUEST',
    description: 'Requests for buzzer/intercom setup, access cards, keys, elevator access, package lockers, Expedibox, or building access configuration',
    keywords: ['buzzer', 'intercom', 'sonnerie', 'puce', 'chip', 'access card', 'key', 'clé', 'elevator', 'ascenseur', 'door', 'porte', 'access', 'accès', 'phone number', 'numéro de téléphone', 'package', 'colis', 'locker', 'casier', 'lockers', 'casiers', 'expedibox', 'box', 'boite', 'enregistré', 'registered', 'registration', 'code', 'code d\'accès', 'access code'],
    patterns: [
      /\b(buzzer|intercom|sonnerie|sonner)\b/gi,
      /\b(puce|chip|access card|key card|clé)\b/gi,
      /\b(elevator|ascenseur).*(call|calling)|(calling|appeler).*(elevator|ascenseur)\b/gi,
      /\b(door.*open|ouvrir.*porte|composer.*\d+.*ouvrir)\b/gi,
      /\b(phone.*number|numéro.*téléphone|téléphone)\b/gi,
      /\b(condo.*\d{4}|unit.*\d{4}).*(buzzer|intercom|puce|access)\b/gi,
      /\b(connect.*buzzer|setup.*buzzer|configure.*access)\b/gi,
      /\b(package|colis|locker|casier|lockers|casiers|expedibox|box|boite)\b/gi,
      /\b(enregistré|registered|registration|enregistrer|register)\b/gi,
      /\b(code.*colis|package.*code|locker.*code|casier.*code|access.*code|code.*accès)\b/gi,
      /\b(ancien.*locataire|old.*tenant|précédent.*locataire|previous.*tenant)\b/gi,
      /\b(récupérer.*colis|retrieve.*package|get.*package|obtenir.*code)\b/gi
    ],
    priority: 8
  },
  {
    id: 'customer-request',
    name: 'CUSTOMER REQUEST',
    description: 'Customer inquiries, requests, complaints, general questions, FAQs, or information requests',
    keywords: ['request', 'inquiry', 'question', 'complaint', 'issue', 'problem', 'help', 'need', 'customer', 'tenant', 'question', 'questions', 'questionnement', 'information', 'explain', 'understand', 'why', 'what', 'how', 'who', 'when'],
    patterns: [
      /\b(request|inquiry|question|ask|questions?|questionnement)\b/gi,
      /\b(complaint|issue|problem|concern)\b/gi,
      /\b(customer|tenant|resident|client|co-owner|co-propriétaire)\b/gi,
      /\b(need|want|would like|please|aimerait savoir|vouloir savoir)\b/gi,
      /\b(what|why|how|who|when|where|quel|quelle|comment|pourquoi)\b/gi,
      /\b(explain|understand|information|informations|details?|détails?)\b/gi,
      /\b(change.*management|changement.*gestionnaire|board.*directors|conseil.*administration|CA)\b/gi,
      /\b(fees?|frais|costs?|coûts|parking|stationnement|security|sécurité)\b/gi
    ],
    priority: 7
  },
  {
    id: 'work-building',
    name: 'WORK NEEDING TO BE DONE IN THE BUILDING',
    description: 'Maintenance requests, repairs, construction, HVAC issues, plumbing maintenance, drain cleaning, blocked toilets, or building work needed',
    keywords: ['repair', 'maintenance', 'fix', 'broken', 'leak', 'plumbing', 'electrical', 'heating', 'construction', 'work', 'hvac', 'air conditioning', 'thermostat', 'heat', 'technician', 'service call', 'inspect', 'inspection', 'malfunction', 'corrective measures', 'technical solution', 'toilet', 'toilettes', 'blocked', 'bouché', 'bouchées', 'drain', 'drainage', 'débouchage', 'débouchages', 'nettoyage drain', 'drain cleaning', 'plombier', 'plumber', 'colonne', 'column', 'récurrent', 'recurring', 'répétition'],
    patterns: [
      /\b(repair|fix|broken|damaged|issue|problem|malfunction)\b/gi,
      /\b(maintenance|maintain|service|service call)\b/gi,
      /\b(leak|plumbing|electrical|heating|ac|air conditioning|hvac)\b/gi,
      /\b(heating.*unit|heat.*turned on|thermostat|heating.*system|hvac.*system)\b/gi,
      /\b(technician|inspect|inspection|schedule.*visit|service call)\b/gi,
      /\b(construction|renovation|renovate|work needed)\b/gi,
      /\b(building|property|apartment|unit|common areas?)\b/gi,
      /\b(mechanical room|panel|centrally controlled|electrical panel|breaker)\b/gi,
      /\b(corrective.*measures|technical.*solution|system.*malfunction)\b/gi,
      /\b(toilet.*bouché|toilettes.*bouchées|blocked.*toilet|toilet.*blocked)\b/gi,
      /\b(drain.*cleaning|nettoyage.*drain|drainage|débouchage|débouchages)\b/gi,
      /\b(plombier.*appel|appel.*plombier|plumber.*call|call.*plumber)\b/gi,
      /\b(colonne.*immeuble|building.*column|même.*colonne|same.*column)\b/gi,
      /\b(problème.*récurrent|recurring.*problem|répétition|récurrent)\b/gi,
      /\b(éviter.*dégât|prevent.*damage|risque.*refoulement|backup.*risk)\b/gi,
      /\b(vérification.*colonne|inspect.*column|check.*drain|vérifier.*drain)\b/gi
    ],
    priority: 9
  },
  {
    id: 'upcoming-tasks',
    name: 'THINGS TO BE DONE IN THE COMING WEEKS',
    description: 'Scheduled tasks, upcoming events, or planned activities',
    keywords: ['upcoming', 'scheduled', 'planned', 'next week', 'coming weeks', 'future', 'calendar', 'appointment', 'action items'],
    patterns: [
      /\b(upcoming|scheduled|planned|future)\b/gi,
      /\b(next week|coming weeks|in the next|soon)\b/gi,
      /\b(calendar|appointment|meeting|event)\b/gi,
      /\b(todo|task|action item|reminder)\b/gi,
      /\b(review.*rules|meet.*guards|discuss.*protocol)\b/gi
    ],
    priority: 6
  },
  {
    id: 'mensual-report',
    name: 'MENSUAL REPORT',
    description: 'Monthly reports, summaries, or periodic updates',
    keywords: ['monthly', 'report', 'summary', 'update', 'mensual', 'period', 'review'],
    patterns: [
      /\b(monthly|mensual|month)\b/gi,
      /\b(report|summary|update|review)\b/gi,
      /\b(period|periodic|regular)\b/gi
    ],
    priority: 5
  },
  {
    id: 'financial-report',
    name: 'FINANCIAL REPORT',
    description: 'Financial statements, invoices, payments, budgets, condo fees, PPA (pre-authorized payment), or accounting-related emails',
    keywords: ['financial', 'invoice', 'payment', 'budget', 'expense', 'revenue', 'accounting', 'money', 'cost', 'condo fees', 'frais de condo', 'frais copropriété', 'PPA', 'paiement préautorisé', 'pre-authorized payment', 'préautorisé', 'monthly fees', 'frais mensuels', 'charges communes', 'common charges'],
    patterns: [
      /\b(financial|finance|fiscal)\b/gi,
      /\b(invoice|payment|bill|charge)\b/gi,
      /\b(budget|expense|revenue|cost|price)\b/gi,
      /\b(accounting|account|balance|statement)\b/gi,
      /\$[\d,]+(?:\.\d{2})?/g, // Currency amounts
      /\b(condo.*fees|frais.*condo|frais.*copropriété|monthly.*fees|frais.*mensuels)\b/gi,
      /\b(PPA|paiement.*préautorisé|pre-authorized.*payment|préautorisé)\b/gi,
      /\b(charges.*communes|common.*charges|frais.*mensuels|monthly.*charges)\b/gi,
      /\b(paiement.*frais|payment.*condo|formulaire.*PPA|PPA.*form)\b/gi,
      /\b(montant.*prélevé|amount.*withdrawn|prélèvement|withdrawal)\b/gi
    ],
    priority: 8
  },
  {
    id: 'late-payment-followup',
    name: 'LATE PAYMENT FOLLOW-UP',
    description: 'Follow-up emails for late condo fees, overdue payments, payment reminders, arrears, or collection notices',
    keywords: ['late payment', 'paiement en retard', 'overdue', 'en souffrance', 'arrears', 'arrérages', 'past due', 'échu', 'reminder', 'rappel', 'collection', 'recouvrement', 'unpaid', 'impayé', 'balance due', 'solde dû', 'outstanding', 'en attente', 'payment reminder', 'rappel paiement'],
    patterns: [
      /\b(late.*payment|paiement.*retard|overdue|en.*souffrance)\b/gi,
      /\b(arrears|arrérages|past.*due|échu)\b/gi,
      /\b(payment.*reminder|rappel.*paiement|reminder.*payment)\b/gi,
      /\b(unpaid|impayé|balance.*due|solde.*dû)\b/gi,
      /\b(outstanding.*balance|solde.*en.*attente|amount.*owed)\b/gi,
      /\b(collection|recouvrement|collect.*payment)\b/gi,
      /\b(days.*overdue|jours.*retard|month.*overdue|mois.*retard)\b/gi,
      /\b(interest.*charges|intérêts|late.*fee|frais.*retard)\b/gi
    ],
    priority: 9
  },
  {
    id: 'supplier-work-followup',
    name: 'SUPPLIER WORK FOLLOW-UP',
    description: 'Follow-up emails with suppliers, contractors, or vendors regarding work completion, invoicing, quality issues, or project status',
    keywords: ['supplier', 'fournisseur', 'contractor', 'entrepreneur', 'vendor', 'vendeur', 'work completed', 'travaux terminés', 'invoice', 'facture', 'quality', 'qualité', 'follow-up', 'suivi', 'project status', 'statut projet', 'inspection', 'inspection', 'warranty', 'garantie', 'punch list', 'liste déficiences'],
    patterns: [
      /\b(supplier|fournisseur|contractor|entrepreneur|vendor|vendeur)\b/gi,
      /\b(work.*completed|travaux.*terminés|project.*complete|projet.*terminé)\b/gi,
      /\b(follow-up|suivi|follow.*up.*work|suivi.*travaux)\b/gi,
      /\b(invoice.*work|facture.*travaux|payment.*supplier|paiement.*fournisseur)\b/gi,
      /\b(quality.*issue|problème.*qualité|defect|défaut|deficiency|déficience)\b/gi,
      /\b(inspection.*required|inspection.*requise|final.*inspection|inspection.*finale)\b/gi,
      /\b(warranty.*work|travaux.*garantie|guarantee|garantie)\b/gi,
      /\b(punch.*list|liste.*déficiences|deficiency.*list|liste.*défauts)\b/gi,
      /\b(project.*status|statut.*projet|work.*status|statut.*travaux)\b/gi
    ],
    priority: 7
  },
  {
    id: 'weekly-board-update',
    name: 'WEEKLY BOARD UPDATE',
    description: 'Weekly updates, summaries, or reports for board of directors covering important follow-ups, incidents, financial matters, or operational status',
    keywords: ['weekly update', 'mise à jour hebdomadaire', 'board update', 'mise à jour conseil', 'weekly report', 'rapport hebdomadaire', 'board summary', 'résumé conseil', 'important follow-up', 'suivi important', 'board matters', 'affaires conseil', 'directors update', 'mise à jour directeurs'],
    patterns: [
      /\b(weekly.*update|mise.*jour.*hebdomadaire|weekly.*report|rapport.*hebdomadaire)\b/gi,
      /\b(board.*update|mise.*jour.*conseil|directors.*update|mise.*jour.*directeurs)\b/gi,
      /\b(board.*summary|résumé.*conseil|weekly.*summary|résumé.*hebdomadaire)\b/gi,
      /\b(important.*follow-up|suivi.*important|matters.*board|affaires.*conseil)\b/gi,
      /\b(week.*ending|semaine.*terminant|period.*summary|résumé.*période)\b/gi,
      /\b(board.*matters|affaires.*conseil|directors.*matters|affaires.*directeurs)\b/gi
    ],
    priority: 8
  },
  {
    id: 'eviction-request',
    name: 'EVICTION REQUEST',
    description: 'Eviction requests, TAL proceedings, tenant removal requests, formal eviction notices, co-owner responsibility for tenant violations, or eviction-related board decisions',
    keywords: ['eviction', 'expulsion', 'expulsé', 'TAL', 'tribunal administratif du logement', 'remove tenant', 'expulser locataire', 'eviction order', 'ordre d\'expulsion', 'formal notice', 'avis formel', 'eviction process', 'processus d\'expulsion', 'co-owner responsibility', 'responsabilité copropriétaire', 'lease termination', 'résiliation bail', 'voluntary departure', 'départ volontaire', 'grace period', 'délai de grâce', 'eviction application', 'demande d\'expulsion', 'board decision', 'décision conseil', 'police called', 'police.*unit'],
    patterns: [
      /\b(eviction|expulsion|expulsé|expulser)\b/gi,
      /\b(TAL|tribunal.*administratif.*logement|tribunal.*logement)\b/gi,
      /\b(remove.*tenant|expulser.*locataire|evict.*tenant)\b/gi,
      /\b(eviction.*order|ordre.*expulsion|formal.*notice.*eviction|eviction.*notice)\b/gi,
      /\b(eviction.*process|processus.*expulsion|démarche.*expulsion)\b/gi,
      /\b(look.*for.*report|check.*if.*happened.*again|récidive.*eviction)\b/gi,
      /\b(unit.*\d{4}.*eviction|eviction.*unit.*\d{4}|tenant.*eviction.*2303)\b/gi,
      /\b(co-owner.*responsible|responsabilité.*copropriétaire|owner.*responsible.*tenant)\b/gi,
      /\b(lease.*termination|résiliation.*bail|terminate.*lease)\b/gi,
      /\b(voluntary.*departure|départ.*volontaire|leave.*voluntarily)\b/gi,
      /\b(grace.*period|délai.*grâce|one.*month|1.*month|30.*days)\b/gi,
      /\b(eviction.*application|demande.*expulsion|file.*eviction|TAL.*application)\b/gi,
      /\b(board.*decision.*eviction|décision.*conseil.*expulsion|syndicate.*decision)\b/gi,
      /\b(police.*called|police.*unit|police.*involvement|appel.*police)\b/gi,
      /\b(multiple.*violations|répétées.*violations|repeated.*violations)\b/gi,
      /\b(fine.*co-owner|amende.*copropriétaire|\$50.*\$500|50.*500.*per.*incident)\b/gi,
      /\b(declaration.*co-ownership|declaration.*copropriété|building.*rules)\b/gi,
      /\b(TAL.*record|dossier.*TAL|TAL.*file|tribunal.*file)\b/gi,
      /\b(tenant.*must.*leave|must.*leave.*now|vacate.*unit)\b/gi
    ],
    priority: 9 // High priority - legal/administrative action
  },
  {
    id: 'purchase-request',
    name: 'PURCHASE REQUEST',
    description: 'Purchase requests for equipment, furniture, signage, gym equipment, or facility improvements',
    keywords: ['purchase', 'achat', 'buy', 'acheter', 'equipment', 'équipement', 'gym purchase', 'achat gym', 'signage', 'panneau', 'holder', 'A4 holder', 'plastic holder', 'furniture', 'meubles', 'facility purchase', 'achat équipement'],
    patterns: [
      /\b(purchase|achat|buy|acheter|acquire)\b/gi,
      /\b(gym.*purchase|achat.*gym|gym.*equipment|équipement.*gym)\b/gi,
      /\b(signage|panneau|sign|affiche|holder|A4.*holder|plastic.*holder)\b/gi,
      /\b(furniture|meubles|equipment|équipement|facility.*purchase)\b/gi,
      /\b(purchase.*request|demande.*achat|approval.*purchase|approuver.*achat)\b/gi,
      /\b(Club.*piscine|UBER.*signage|Food.*Delivery.*signage|desk.*signage)\b/gi
    ],
    priority: 7
  },
  {
    id: 'vendor-payment-request',
    name: 'VENDOR PAYMENT REQUEST',
    description: 'Vendor payment requests, supplier payments, payment processing for contractors or service providers, void cheque requests, billing address changes, or payment setup',
    keywords: ['vendor payment', 'paiement fournisseur', 'supplier payment', 'paiement fournisseurs', 'Otonom', 'Otonom Solution', 'pay vendor', 'payer fournisseur', 'vendor invoice', 'facture fournisseur', 'contractor payment', 'paiement entrepreneur', 'void cheque', 'specimen cheque', 'chèque annulé', 'chèque spécimen', 'billing address', 'adresse de facturation', 'adresse facturation', 'nouvelle compagnie', 'new company', 'board approval', 'approbation conseil', 'conseil administration', 'CA'],
    patterns: [
      /\b(vendor.*payment|paiement.*fournisseur|supplier.*payment|paiement.*fournisseurs)\b/gi,
      /\b(pay.*vendor|payer.*fournisseur|process.*vendor.*payment)\b/gi,
      /\b(vendor.*invoice|facture.*fournisseur|contractor.*payment|paiement.*entrepreneur)\b/gi,
      /\b(Otonom|Otonom.*Solution|payment.*Otonom)\b/gi,
      /\b(approve.*vendor.*payment|approuver.*paiement.*fournisseur)\b/gi,
      /\b(void.*cheque|specimen.*cheque|chèque.*annulé|chèque.*spécimen|chèque.*void)\b/gi,
      /\b(billing.*address|adresse.*facturation|adresse.*facturation|nouvelle.*adresse|new.*address)\b/gi,
      /\b(nouvelle.*compagnie|new.*company|nouveau.*fournisseur|new.*vendor)\b/gi,
      /\b(board.*approval|approbation.*conseil|conseil.*administration|CA.*approval|approval.*CA)\b/gi,
      /\b(facture.*syndicat|syndicate.*invoice|invoice.*syndicate)\b/gi,
      /\b(compagnie.*gestion.*changé|management.*company.*changed|changement.*gestionnaire)\b/gi
    ],
    priority: 8
  },
  {
    id: 'banking-request',
    name: 'BANKING REQUEST',
    description: 'Bank account access requests, credit card requests, banking setup, or financial account management',
    keywords: ['bank account', 'compte de banque', 'compte bancaire', 'credit card', 'carte de crédit', 'banking', 'banque', 'account access', 'accès compte', 'bank card', 'carte bancaire', 'financial account', 'compte financier'],
    patterns: [
      /\b(bank.*account|compte.*banque|compte.*bancaire|banking.*account)\b/gi,
      /\b(credit.*card|carte.*crédit|bank.*card|carte.*bancaire)\b/gi,
      /\b(account.*access|accès.*compte|bank.*access|accès.*banque)\b/gi,
      /\b(demande.*carte|request.*card|demande.*compte|request.*account)\b/gi,
      /\b(banking.*setup|setup.*bank.*account|ouvrir.*compte|open.*account)\b/gi
    ],
    priority: 8
  },
  {
    id: 'operations-task',
    name: 'OPERATIONS TASK',
    description: 'Operational tasks, follow-ups, staff management, welcome emails, security follow-ups, or administrative operations',
    keywords: ['operations', 'opérations', 'task', 'tâche', 'follow-up', 'suivi', 'follow up', 'welcome email', 'courriel de bienvenue', 'security follow-up', 'suivi sécurité', 'janitor', 'concierge', 'staff', 'personnel', 'operational', 'opérationnel'],
    patterns: [
      /\b(operations|opérations|operational|opérationnel)\b/gi,
      /\b(task|tâche|tasks|tâches|operational.*task)\b/gi,
      /\b(follow-up|follow.*up|suivi|follow.*through)\b/gi,
      /\b(welcome.*email|courriel.*bienvenue|welcome.*resident|bienvenue.*résident)\b/gi,
      /\b(security.*follow-up|suivi.*sécurité|security.*follow.*up)\b/gi,
      /\b(janitor|concierge|staff|personnel|employee|employé)\b/gi,
      /\b(tasks.*well.*done|tâches.*bien.*faites|staff.*performance)\b/gi,
      /\b(garage.*fob.*access|fob.*access|wifiplex|access.*system)\b/gi
    ],
    priority: 7
  }
];

/**
 * Extract property management-specific entities
 */
export function extractPropertyManagementEntities(text: string): {
  dates: string[];
  amounts: string[];
  locations: string[];
  people: string[];
  documents: string[];
  phoneNumbers?: string[];
} {
  const entities = {
    dates: [] as string[],
    amounts: [] as string[],
    locations: [] as string[],
    people: [] as string[],
    documents: [] as string[],
    phoneNumbers: [] as string[]
  };

  // Extract dates (multiple formats)
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b(next week|this week|coming weeks|tomorrow|today)\b/gi
  ];

  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.dates.push(...matches);
    }
  });

  // Extract amounts (currency)
  const amountPatterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|EUR|€|CAD)/gi,
    /\b(administrative.*fee|fee.*\$|\$\d+\s*per\s*event)/gi,
    /\b(\d+\s*\$|\$\d+\s*par|\d+\s*\$.*heure|\$\d+\/heure)/gi, // French amounts like "250 $ par événement"
    /\b(frais.*\$\d+|\$\d+.*frais)/gi
  ];

  amountPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.amounts.push(...matches);
    }
  });

  // Extract locations (property-related)
  const locationPatterns = [
    /\b(apartment|unit|building|property|address|desk|breakroom|workstation)\s+[A-Z0-9#-]+/gi,
    /\b\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Road|Boulevard|Drive|Lane|Way|Mnt|Mont|Rue|St)\b/gi,
    /\b(floor|level|room|poste|post)\s+\d+/gi,
    /\b[A-Z]\d{1,2}\s+[A-Z]\d{1,2}\s+[A-Z]\d{1,2}\b/gi, // Canadian postal codes
    /\b\d{4}\s+[A-Z][a-z]+\s+St\b/gi, // Addresses like "1160 Mackay St"
    /\b(mechanical room|common areas?|unit.*\d{4})\b/gi,
    /\b(parking|stationnement|places?.*SS\d+|cases?.*stationnement)\b/gi, // Parking spaces
    /\b(corridor|ascenseur|elevator|concierge)\b/gi,
    /\b(unité.*origine|origin.*unit|source.*sinistre|affected.*units|unités.*affectées)\b/gi // Water damage specific
  ];

  locationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.locations.push(...matches);
    }
  });

  // Extract people (names, tenants, contractors, guards)
  const peoplePatterns = [
    /\b(?:Mr|Mrs|Ms|Dr|M\.|Mme)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
    /\b(tenant|contractor|manager|owner|resident|guard|security|président|co-owner|co-propriétaire|locataire)\s+[A-Z][a-z]+/gi,
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Full names
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Three-part names
    /\b(?:syndicate|board.*directors|management)\b/gi
  ];

  peoplePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.people.push(...matches);
    }
  });

  // Extract documents
  const documentPatterns = [
    /\b(?:document|contract|agreement|lease|invoice|receipt|report|attestation|certificate|certificat|notice|formal notice|deed|acte|PPA|home insurance|void cheque|cheque)\s+[A-Z0-9-]+/gi,
    /\b[A-Z]{2,}\s*\d{4,}/g, // Document IDs like "DOC 2024"
    /\b(law\s*16|loi\s*16)\b/gi, // Law 16 references
    /\bsection\s*\d+\.\d+\.\d+\.\d+/gi, // Legal section references like "10.3.7.32"
    /\b(declaration.*co-ownership|co-ownership.*declaration)\b/gi,
    /\b(TAL|tribunal administratif du logement|eviction.*order|formal.*notice)\b/gi,
    /\b(deed.*sale|acte.*vente|signed.*PPA|home.*insurance|void.*cheque)\b/gi,
    /\b(déclaration.*sinistre|insurance.*claim|dossier.*assurance|police.*assurance|claim.*number)\b/gi // Water damage insurance documents
  ];

  documentPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.documents.push(...matches);
    }
  });

  // Extract phone numbers
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // North American format: 514-777-1731
    /\b\d{3}-\d{3}-\d{4}\b/g, // With dashes
    /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g // With parentheses
  ];

  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.phoneNumbers!.push(...matches);
    }
  });

  // Remove duplicates
  Object.keys(entities).forEach(key => {
    entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])] as any;
  });

  return entities;
}

/**
 * Classify email using rule-based + keyword matching
 */
export function classifyEmailRuleBased(emailText: string): EmailClassification {
  // Ensure we have valid input
  if (!emailText || typeof emailText !== 'string') {
    return {
      template: EMAIL_TEMPLATES[0],
      confidence: 0.1,
      reasoning: 'Invalid email text provided',
      extractedEntities: {
        dates: [],
        amounts: [],
        locations: [],
        people: [],
        documents: []
      }
    };
  }

  const text = emailText.toLowerCase();
  let bestMatch: EmailTemplate | null = null;
  let bestScore = 0;
  let reasoning = '';

  try {
    for (const template of EMAIL_TEMPLATES) {
      let score = 0;
      const matchedKeywords: string[] = [];
      const matchedPatterns: string[] = [];

      // Check keywords
      for (const keyword of template.keywords) {
        try {
          if (text.includes(keyword.toLowerCase())) {
            score += 2;
            matchedKeywords.push(keyword);
          }
        } catch (e) {
          // Skip invalid keywords
        }
      }

      // Check regex patterns
      for (const pattern of template.patterns) {
        try {
          const matches = emailText.match(pattern);
          if (matches && matches.length > 0) {
            score += matches.length * 3;
            matchedPatterns.push(pattern.toString());
          }
        } catch (e) {
          // Skip invalid patterns
        }
      }

      // Boost score based on priority
      score *= (1 + template.priority / 10);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
        reasoning = `Matched ${matchedKeywords.length} keywords and ${matchedPatterns.length} patterns. Keywords: ${matchedKeywords.slice(0, 3).join(', ')}`;
      }
    }

    // Extract entities
    const extractedEntities = extractPropertyManagementEntities(emailText);

    // Calculate confidence (0-1 scale)
    const confidence = Math.min(0.95, Math.max(0.1, bestScore / 50));

    return {
      template: bestMatch || EMAIL_TEMPLATES[0],
      confidence: confidence || 0.3,
      reasoning: reasoning || 'No strong match found, defaulting to first template',
      extractedEntities
    };
  } catch (error: any) {
    // If anything fails, return safe default
    return {
      template: EMAIL_TEMPLATES[0],
      confidence: 0.2,
      reasoning: `Classification error: ${error.message || 'Unknown error'}`,
      extractedEntities: extractPropertyManagementEntities(emailText)
    };
  }
}

/**
 * Classify email using LLM (few-shot learning)
 */
export async function classifyEmailWithLLM(
  emailText: string,
  fewShotExamples: FewShotExample[] = [],
  llmProvider?: any
): Promise<EmailClassification> {
  // Build few-shot prompt
  const examplesText = fewShotExamples
    .slice(0, 5) // Use up to 5 examples
    .map((ex, idx) => {
      return `Example ${idx + 1}:
Email: "${ex.email.substring(0, 200)}..."
Template: ${ex.template}
Confidence: ${ex.confidence}`;
    })
    .join('\n\n');

  const prompt = `You are an email classification system for property management.

Available Templates:
${EMAIL_TEMPLATES.map(t => `- ${t.name}: ${t.description}`).join('\n')}

${fewShotExamples.length > 0 ? `\nFew-Shot Examples:\n${examplesText}\n\n` : ''}

Classify this email into ONE of the templates above:

Email: "${emailText}"

Respond in JSON format:
{
  "template": "TEMPLATE_NAME",
  "confidence": 0.0-1.0,
  "reasoning": "Why this template matches",
  "entities": {
    "dates": [],
    "amounts": [],
    "locations": [],
    "people": [],
    "documents": []
  }
}`;

  // If LLM provider is available, use it
  if (llmProvider) {
    try {
      const response = await llmProvider.generate(prompt);
      
      // Try to extract JSON from response (might be wrapped in markdown or text)
      let parsed: any = null;
      
      // Try direct JSON parse first
      try {
        parsed = JSON.parse(response);
      } catch {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                         response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch {
            // If still fails, try to parse the response text directly
            console.warn('Failed to parse JSON from LLM response, attempting text extraction');
          }
        }
      }
      
      // If we successfully parsed JSON
      if (parsed && parsed.template) {
        const template = EMAIL_TEMPLATES.find(t => t.name === parsed.template) || 
                        EMAIL_TEMPLATES.find(t => t.id === parsed.templateId) ||
                        EMAIL_TEMPLATES[0];
        
        const extractedEntities = parsed.entities || extractPropertyManagementEntities(emailText);
        return {
          template,
          confidence: Math.min(1.0, Math.max(0.0, parsed.confidence || 0.7)),
          reasoning: parsed.reasoning || 'LLM classification',
          extractedEntities: {
            ...extractedEntities,
            phoneNumbers: extractedEntities.phoneNumbers || []
          }
        };
      } else {
        // LLM didn't return valid JSON, try to extract template name from text
        const responseLower = response.toLowerCase();
        for (const template of EMAIL_TEMPLATES) {
          if (responseLower.includes(template.name.toLowerCase()) || 
              responseLower.includes(template.id.toLowerCase())) {
            const extractedEntities = extractPropertyManagementEntities(emailText);
            return {
              template,
              confidence: 0.6, // Lower confidence since we had to guess
              reasoning: `LLM mentioned "${template.name}" in response`,
              extractedEntities: {
                ...extractedEntities,
                phoneNumbers: extractedEntities.phoneNumbers || []
              }
            };
          }
        }
      }
    } catch (error: any) {
      console.error('LLM classification failed, falling back to rule-based:', error.message || error);
    }
  }

  // Fallback to rule-based
  const fallbackResult = classifyEmailRuleBased(emailText);
  return {
    ...fallbackResult,
    extractedEntities: {
      ...fallbackResult.extractedEntities,
      phoneNumbers: fallbackResult.extractedEntities.phoneNumbers || []
    }
  };
}

/**
 * Hybrid classification: Combine rule-based + LLM
 */
export async function classifyEmailHybrid(
  emailText: string,
  fewShotExamples: FewShotExample[] = [],
  llmProvider?: any
): Promise<EmailClassification> {
  // First, try rule-based (fast)
  const ruleBased = classifyEmailRuleBased(emailText);

  // If confidence is high enough, use it
  if (ruleBased.confidence > 0.7) {
    return ruleBased;
  }

  // Otherwise, use LLM for better accuracy
  return classifyEmailWithLLM(emailText, fewShotExamples, llmProvider);
}

