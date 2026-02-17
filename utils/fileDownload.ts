import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Downloads a text file, using the native Share sheet on iOS/Android
 * and the standard browser download on web.
 *
 * On native platforms, `<a download>` + blob URLs do not work in WKWebView.
 * Instead we write the file to the cache directory and open the system share sheet.
 */
export async function downloadTextFile(
    content: string,
    filename: string,
    mimeType: string = 'text/plain;charset=utf-8'
): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        const writeResult = await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
        });

        await Share.share({
            title: filename,
            url: writeResult.uri,
        });
    } else {
        const blob = new Blob([content], { type: mimeType });
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

/**
 * Downloads a Blob file, using the native Share sheet on iOS/Android
 * and the standard browser download on web.
 *
 * Use this for binary data or blobs received from API responses.
 */
export async function downloadBlobFile(
    blob: Blob,
    filename: string
): Promise<void> {
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
