import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Shield, FileText, Mail, Phone, Globe, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';

type TabType = 'de' | 'en';

interface Section {
  id: string;
  title: string;
  content: string;
}

const deSections: Section[] = [
  {
    id: 'responsible',
    title: '1. Verantwortlicher',
    content:
      'Sunil Kumar Singh\nc/o medicortex.de\nBerlin, Deutschland\n\nE-Mail: hello@medicortex.de\nTelefon: +49 163 2509620\n\nSunil Kumar Singh ist Verantwortlicher gemäß Art. 4 Nr. 7 DSGVO für die Verarbeitung personenbezogener Daten in der FSP Vorbereitungs-App.',
  },
  {
    id: 'data_types',
    title: '2. Verarbeitete Datenarten',
    content:
      'Für die App-Funktionalität erfassen wir:\n\n• Registrierungsdaten: E-Mail-Adresse, Passwort (verschlüsselt)\n• Lernfortschrittsdaten: Quiz-Ergebnisse, Trainingszeit, Modulabschlüsse\n• Technische Daten: IP-Adresse (anonymisiert), Geräte-ID, Browser-Typ\n• Keine sensiblen Gesundheitsdaten gemäß Art. 9 DSGVO',
  },
  {
    id: 'legal_basis',
    title: '3. Rechtsgrundlagen der Verarbeitung',
    content:
      'App-Registrierung & -Nutzung:\nArt. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)\n\nApp-Sicherheit & Betrieb:\nArt. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)\n\nApp-Verbesserung (anonymisiert):\nArt. 6 Abs. 1 lit. f DSGVO\n\nNewsletter (optional):\nArt. 6 Abs. 1 lit. a DSGVO (Einwilligung)',
  },
  {
    id: 'retention',
    title: '4. Speicherdauer & Löschung',
    content:
      '• Aktive Nutzer: Solange Konto besteht\n• Inaktive Nutzer: Automatische Löschung nach 24 Monaten\n• Gesetzlich vorgeschrieben: 10 Jahre für Buchhaltungsdaten (§ 257 HGB)',
  },
  {
    id: 'rights',
    title: '5. Ihre Rechte gemäß DSGVO',
    content:
      'Kontaktieren Sie hello@medicortex.de für:\n\n• Auskunft (Art. 15 DSGVO)\n• Berichtigung/Löschung (Art. 16/17 DSGVO)\n• Widerruf jederzeit (Art. 7 Abs. 3 DSGVO)\n• Datenübertragbarkeit (Art. 20 DSGVO)\n• Beschwerde bei der BfDI (www.bfdi.bund.de)',
  },
  {
    id: 'security',
    title: '6. Technische & Organisatorische Maßnahmen',
    content:
      '• TLS 1.3 Verschlüsselung (HTTPS)\n• Server in der EU (kein US-Transfer)\n• Passwort-Hashing (bcrypt)\n• Rate-Limiting gegen Brute-Force\n• Regelmäßige Sicherheitsupdates',
  },
  {
    id: 'third_party',
    title: '7. Keine Drittanbieter-Tracking',
    content:
      '• Keine Google Analytics oder ähnliche Tools\n• Keine Werbung oder Personalisierung\n• Hosting: EU-Cloud-Provider (Details auf Anfrage)',
  },
  {
    id: 'cookies',
    title: '8. Cookies',
    content:
      'Nur funktional notwendig:\n\n• Session-Cookies (Laufzeit: Sitzung)\n• Auth-Cookies (Laufzeit: 30 Tage, verschlüsselt)',
  },
  {
    id: 'dpo',
    title: '9. Datenschutzbeauftragter',
    content:
      'Sunil Kumar Singh (hello@medicortex.de)\n\nBei <20 Mitarbeitern gemäß § 38 BDSG nicht zwingend erforderlich.',
  },
  {
    id: 'changes',
    title: '10. Änderungen dieser Erklärung',
    content:
      'Wir informieren über wesentliche Änderungen per E-Mail oder In-App-Benachrichtigung.\n\nLetzte Aktualisierung: 27. Februar 2026\nSunil Kumar Singh, medicortex.de',
  },
];

const enSections: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    content:
      'FSP Preparation App by Sunil Kumar Singh\nhello@medicortex.de | +49 163 2509620\nBerlin, Germany\nLast updated: Feb 27, 2026',
  },
  {
    id: 'collect',
    title: 'What We Collect',
    content:
      '• Email address (for account registration)\n• Learning progress (quiz scores, completed modules)\n• Anonymized device data (device type, OS version)\n\nWe do NOT collect:\n• Health or medical data\n• Location data\n• Financial information beyond payment confirmation',
  },
  {
    id: 'no_tracking',
    title: 'No Tracking, No Ads',
    content:
      'We do not use Google Analytics, Facebook Pixel, or any advertising trackers. Your learning data is private and used only to improve your in-app experience.',
  },
  {
    id: 'eu_servers',
    title: 'EU Servers Only',
    content:
      'All data is stored and processed on EU-based servers. No data is transferred to the United States or other third countries without adequate protection measures.',
  },
  {
    id: 'gdpr',
    title: 'Your GDPR Rights',
    content:
      'As an EU resident, you have the right to:\n\n• Access your data (Art. 15 GDPR)\n• Correct inaccurate data (Art. 16 GDPR)\n• Delete your data (Art. 17 GDPR)\n• Data portability (Art. 20 GDPR)\n• Withdraw consent at any time (Art. 7 GDPR)\n\nExercise any right by emailing hello@medicortex.de',
  },
  {
    id: 'security_en',
    title: 'Security',
    content:
      '• TLS 1.3 encryption on all connections\n• Passwords stored using bcrypt hashing\n• Rate limiting to prevent brute-force attacks\n• Regular security audits and updates',
  },
  {
    id: 'contact_en',
    title: 'Contact',
    content:
      'For privacy-related requests or questions:\n\nSunil Kumar Singh\nhello@medicortex.de\n+49 163 2509620\nmedicortex.de',
  },
];

function SectionAccordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      style={styles.accordion}
      onPress={() => setOpen(p => !p)}
      activeOpacity={0.85}
    >
      <View style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{section.title}</Text>
        {open ? (
          <ChevronUp color={Colors.dark.primary} size={18} />
        ) : (
          <ChevronDown color={Colors.dark.textMuted} size={18} />
        )}
      </View>
      {open && (
        <Text style={styles.accordionBody}>{section.content}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function TermsPrivacyScreen() {
  const [tab, setTab] = useState<TabType>('de');

  const sections = tab === 'de' ? deSections : enSections;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Shield color={Colors.dark.primary} size={30} />
        </View>
        <Text style={styles.heroTitle}>Datenschutz & Nutzung</Text>
        <Text style={styles.heroSubtitle}>FSP Vorbereitung App · Stand: 27. Februar 2026</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'de' && styles.tabBtnActive]}
          onPress={() => setTab('de')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, tab === 'de' && styles.tabLabelActive]}>
            🇩🇪  Deutsch
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'en' && styles.tabBtnActive]}
          onPress={() => setTab('en')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, tab === 'en' && styles.tabLabelActive]}>
            🇬🇧  English
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'de' && (
        <View style={styles.infoBox}>
          <FileText color={Colors.dark.primary} size={16} />
          <Text style={styles.infoBoxText}>
            Datenschutzerklärung gemäß DSGVO · Art. 4 Nr. 7
          </Text>
        </View>
      )}

      {tab === 'en' && (
        <View style={styles.infoBox}>
          <Shield color={Colors.dark.primary} size={16} />
          <Text style={styles.infoBoxText}>
            GDPR-compliant · No tracking · EU servers · Your data stays private
          </Text>
        </View>
      )}

      <View style={styles.sectionList}>
        {sections.map((section, index) => {
          const isLast = index === sections.length - 1;
          return (
            <View key={section.id} style={isLast ? undefined : styles.sectionDivider}>
              <SectionAccordion section={section} />
            </View>
          );
        })}
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>
          {tab === 'de' ? 'Kontakt' : 'Contact Us'}
        </Text>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('mailto:hello@medicortex.de')}
          activeOpacity={0.8}
        >
          <Mail color={Colors.dark.primary} size={18} />
          <Text style={styles.contactText}>hello@medicortex.de</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('tel:+491632509620')}
          activeOpacity={0.8}
        >
          <Phone color={Colors.dark.primary} size={18} />
          <Text style={styles.contactText}>+49 163 2509620</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('https://medicortex.de')}
          activeOpacity={0.8}
        >
          <Globe color={Colors.dark.primary} size={18} />
          <Text style={styles.contactText}>medicortex.de</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        {tab === 'de'
          ? '© 2026 Sunil Kumar Singh · medicortex.de · Alle Rechte vorbehalten'
          : '© 2026 Sunil Kumar Singh · medicortex.de · All rights reserved'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 4,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${Colors.dark.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${Colors.dark.primary}40`,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Colors.dark.primary}15`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.dark.primary}30`,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  accordion: {
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
  },
  accordionBody: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  contactCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  contactText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.dark.textMuted,
    lineHeight: 18,
  },
});
