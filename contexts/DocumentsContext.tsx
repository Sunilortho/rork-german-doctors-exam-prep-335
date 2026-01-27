import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentCategory, DocumentStatus } from '@/types';

const STORAGE_KEY = '@roadmap_germany_documents';

const INITIAL_DOCUMENTS: DocumentCategory[] = [
  {
    id: '1',
    title: '1) Identity & Legal',
    isExpanded: true,
    items: [
      {
        id: '1-1',
        title: 'Passport (valid)',
        status: 'not_started',
        authorityTip: 'Used for identity verification across authorities and translations.',
        commonMistake: 'Submitting a passport with <6 months validity can delay appointments.',
      },
      {
        id: '1-2',
        title: 'Birth certificate (apostille if required)',
        status: 'not_started',
        authorityTip: 'Proves identity and legal name consistency for German dossiers.',
        commonMistake: 'Name mismatches vs passport often trigger re-translation requests.',
      },
      {
        id: '1-3',
        title: 'Marriage certificate / name change proof (if applicable)',
        status: 'not_started',
        authorityTip: 'Needed to reconcile surname changes during authority file review.',
        commonMistake: 'Forgetting this leads to identity clarification queries.',
      },
      {
        id: '1-4',
        title: 'Affidavit / declaration (if requested by Bundesland)',
        status: 'not_started',
        authorityTip: 'Some authorities require formal declarations about authenticity or status.',
        commonMistake: 'Using an incorrect template or missing signature date can invalidate it.',
      },
    ],
  },
  {
    id: '2',
    title: '2) Medical Education',
    isExpanded: false,
    items: [
      {
        id: '2-1',
        title: 'MBBS degree certificate',
        status: 'not_started',
        authorityTip: 'Core document for Approbation equivalence assessment (Gleichwertigkeit).',
        commonMistake: 'Submitting provisional degree without final confirmation can be rejected.',
      },
      {
        id: '2-2',
        title: 'University transcripts (all years)',
        status: 'not_started',
        authorityTip: 'Authorities compare curriculum content and hours against German standards.',
        commonMistake: 'Missing semester-wise details often triggers additional requests.',
      },
      {
        id: '2-3',
        title: 'Detailed syllabus / curriculum hours',
        status: 'not_started',
        authorityTip: 'Critical for equivalence checks; supports mapping of clinical hours.',
        commonMistake: 'Providing generic brochure-level syllabus is usually not accepted.',
      },
      {
        id: '2-4',
        title: 'Internship / CRRI logbook (if available)',
        status: 'not_started',
        authorityTip: 'Shows hands-on exposure; may support equivalence narrative.',
        commonMistake: 'Unstamped or unsigned logs are treated as unverifiable.',
      },
    ],
  },
  {
    id: '3',
    title: '3) Internship & Clinical Experience',
    isExpanded: false,
    items: [
      {
        id: '3-1',
        title: 'Work experience letters (hospitals/clinics)',
        status: 'not_started',
        authorityTip: 'Demonstrates clinical responsibility and continuity of practice.',
        commonMistake: 'Letters without exact dates/department/supervisor details are weak.',
      },
      {
        id: '3-2',
        title: 'Payslips / appointment letters (supporting)',
        status: 'not_started',
        authorityTip: 'Supports authenticity of employment claims when questioned.',
        commonMistake: 'Missing these can cause delays if main letter is questioned.',
      },
    ],
  },
  {
    id: '4',
    title: '4) Registration & Licensing',
    isExpanded: false,
    items: [
      {
        id: '4-1',
        title: 'NMC/SMC registration certificate',
        status: 'not_started',
        authorityTip: 'Shows legal right to practice medicine in home country.',
        commonMistake: 'Expired registration or unclear registration number causes delays.',
      },
      {
        id: '4-2',
        title: 'Certificate of Good Standing',
        status: 'not_started',
        authorityTip: 'German authorities require proof of professional reliability.',
        commonMistake: 'Submitting an old certificate (outside validity window) is a top issue.',
      },
      {
        id: '4-3',
        title: 'Declaration of no disciplinary action (if required)',
        status: 'not_started',
        authorityTip: 'Complements good standing for authority risk checks.',
        commonMistake: 'Leaving wording vague can trigger follow-up queries.',
      },
    ],
  },
  {
    id: '5',
    title: '5) Language & Exams',
    isExpanded: false,
    items: [
      {
        id: '5-1',
        title: 'German B2 certificate',
        status: 'not_started',
        authorityTip: 'Baseline language requirement for many states before FSP.',
        commonMistake: 'Some states require B2 Medizin; check Bundesland requirements.',
      },
      {
        id: '5-2',
        title: 'FSP registration / invitation (if received)',
        status: 'not_started',
        authorityTip: 'Shows you are in the exam pipeline and may be requested for visa.',
        commonMistake: 'Not keeping the latest email/letter thread can cost time later.',
      },
      {
        id: '5-3',
        title: 'FSP result certificate (after passing)',
        status: 'not_started',
        authorityTip: 'Required for final Approbation submission.',
        commonMistake: 'Ensure the certificate mentions "bestanden" clearly.',
      },
    ],
  },
  {
    id: '6',
    title: '6) Germany-Specific Documents',
    isExpanded: false,
    items: [
      {
        id: '6-1',
        title: 'Certified translations (German)',
        status: 'not_started',
        authorityTip: 'German authorities typically require sworn/certified translations.',
        commonMistake: 'Non-sworn translations are a frequent rejection reason.',
      },
      {
        id: '6-2',
        title: 'Apostille / legalization (as required)',
        status: 'not_started',
        authorityTip: 'Authenticates documents internationally depending on Bundesland rules.',
        commonMistake: 'Apostille on the wrong document version (copy vs original) causes issues.',
      },
      {
        id: '6-3',
        title: 'CV (Lebenslauf) in German',
        status: 'not_started',
        authorityTip: 'Used to assess timelines, gaps, and training continuity.',
        commonMistake: 'Unexplained gaps or inconsistent dates trigger extra questioning.',
      },
      {
        id: '6-4',
        title: 'Motivation letter (optional but helpful)',
        status: 'not_started',
        authorityTip: 'Clarifies pathway, state choice, and readiness; sometimes requested.',
        commonMistake: 'Overpromising clinical skills or using translated templates looks weak.',
      },
      {
        id: '6-5',
        title: 'Police clearance certificate',
        status: 'not_started',
        authorityTip: 'Supports reliability checks; often required for visa/employer.',
        commonMistake: 'Expired PCC or wrong issuing country can cause rejection.',
      },
      {
        id: '6-6',
        title: 'Health insurance confirmation',
        status: 'not_started',
        authorityTip: 'Required for visa and employment contracts.',
        commonMistake: 'Temporary travel insurance is not accepted for long-term residence.',
      },
    ],
  },
];

export const [DocumentsProvider, useDocuments] = createContextHook(() => {
  const [categories, setCategories] = useState<DocumentCategory[]>(INITIAL_DOCUMENTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocuments = async (updated: DocumentCategory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCategories(updated);
    } catch (error) {
      console.log('Error saving documents:', error);
    }
  };

  const toggleCategory = useCallback((categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
  }, []);

  const updateDocumentStatus = useCallback((categoryId: string, itemId: string, status: DocumentStatus) => {
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          ),
        };
      }
      return cat;
    });
    saveDocuments(updated);
  }, [categories]);

  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    
    categories.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (item.status === 'completed') completed++;
        if (item.status === 'in_progress') inProgress++;
      });
    });

    return { total, completed, inProgress };
  }, [categories]);

  return {
    categories,
    isLoading,
    toggleCategory,
    updateDocumentStatus,
    stats,
  };
});
