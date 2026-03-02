import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf, Svg, Circle, Line } from '@react-pdf/renderer';
import { brand } from '../config/brand';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

const colors = {
  primary: brand.primaryColor,
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray800: '#1f2937',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    padding: '10 16',
    borderRadius: 6,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerDate: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.7,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
    color: colors.gray800,
  },
  italic: {
    fontStyle: 'italic',
    color: colors.gray600,
  },
  bold: {
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 8,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
    color: colors.gray400,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray800,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
    marginVertical: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.gray400,
  },
});

const ShipWheelLogo = () => {
  const size = 28;
  const center = 12;
  const ringRadius = 7;
  const spokeLength = 10;
  const hubRadius = 1.75;
  const ringStroke = 2;
  const spokeStroke = 1.8;

  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    spokes.push({
      x1: center - spokeLength * Math.cos(angle),
      y1: center - spokeLength * Math.sin(angle),
      x2: center + spokeLength * Math.cos(angle),
      y2: center + spokeLength * Math.sin(angle),
    });
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {spokes.slice(0, 4).map((spoke, i) => (
        <Line
          key={`spoke-${i}`}
          x1={spoke.x1}
          y1={spoke.y1}
          x2={spoke.x2}
          y2={spoke.y2}
          stroke="white"
          strokeWidth={spokeStroke}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={center} cy={center} r={ringRadius} fill="none" stroke="white" strokeWidth={ringStroke} />
      <Circle cx={center} cy={center} r={hubRadius} fill="white" />
    </Svg>
  );
};

function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();
}

function stripGamificationHash(text: string): string {
  return text.replace(/<!--\s*(gmf-data|do_not_delete):\s*.*?-->\s*$/s, '').trim();
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<Text key={match.index} style={styles.bold}>{match[1]}</Text>);
    } else if (match[2]) {
      parts.push(<Text key={match.index} style={styles.italic}>{match[2]}</Text>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function MarkdownLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('### ')) {
    const text = stripEmojis(trimmed.replace(/^###\s+/, ''));
    return <Text style={styles.h3}>{text}</Text>;
  }
  if (trimmed.startsWith('## ')) {
    const text = stripEmojis(trimmed.replace(/^##\s+/, ''));
    return <Text style={styles.h2}>{text}</Text>;
  }
  if (trimmed.startsWith('# ')) {
    return null;
  }
  if (trimmed === '---' || trimmed === '***') {
    return <View style={styles.hr} />;
  }
  if (trimmed.startsWith('- ') || trimmed.startsWith('– ')) {
    const text = trimmed.replace(/^[-–]\s+/, '');
    return (
      <View style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listText}>{parseInlineFormatting(text)}</Text>
      </View>
    );
  }

  return <Text style={styles.paragraph}>{parseInlineFormatting(trimmed)}</Text>;
}

interface LifeContextPDFProps {
  content: string;
  language: 'de' | 'en';
}

function LifeContextPDFDocument({ content, language }: LifeContextPDFProps) {
  const cleaned = stripGamificationHash(content);
  const lines = cleaned.split('\n');
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const title = language === 'de' ? 'Mein Lebenskontext' : 'My Life Context';
  const appName = language === 'de' ? brand.appNameDe : brand.appName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <ShipWheelLogo />
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>{appName}</Text>
            <Text style={styles.headerDate}>{date}</Text>
          </View>
        </View>

        {lines.map((line, i) => (
          <MarkdownLine key={i} line={line} />
        ))}

        <View style={styles.footer} fixed>
          <Text>{appName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateLifeContextPDF(
  content: string,
  language: 'de' | 'en',
  filename: string = 'Life_Context.pdf'
): Promise<void> {
  const blob = await pdf(
    <LifeContextPDFDocument content={content} language={language} />
  ).toBlob();

  if (Capacitor.isNativePlatform()) {
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      url: writeResult.uri,
    });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
