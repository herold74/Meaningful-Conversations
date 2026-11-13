import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

interface NativeSTTFilePlugin {
  transcribeFile(options: { path: string; language: string }): Promise<{ text: string }>;
}

const NativeSTT = registerPlugin<NativeSTTFilePlugin>('NativeSTT');

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      const comma = raw.indexOf(',');
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const speechLocale = (language: 'de' | 'en') => (language === 'de' ? 'de-DE' : 'en-US');

/** On-device transcription for a recording the cloud cannot reach. No speaker split. */
export async function transcribeAudioOnDevice(file: File, language: 'de' | 'en'): Promise<string> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    throw new Error('on-device transcription is only available on iPhone');
  }
  const path = 'mc-transcript-capture.m4a';
  await Filesystem.writeFile({
    path,
    data: await blobToBase64(file),
    directory: Directory.Cache,
  });
  try {
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    const result = await NativeSTT.transcribeFile({ path: uri, language: speechLocale(language) });
    const text = result?.text?.trim();
    if (!text) throw new Error('empty on-device transcript');
    return text;
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
  }
}
