export interface LoadedFile {
  text: string;
  name: string;
}

const baseName = (fileName: string): string => fileName.replace(/\.[^.]+$/, '') || 'vctrd';

export const isSvgFile = (file: File): boolean => file.type === 'image/svg+xml' || /\.svgz?$/i.test(file.name);

export const firstSvgFile = (files: FileList | null | undefined): File | null =>
  Array.from(files ?? []).find(isSvgFile) ?? null;

export const readSvgFile = async (file: File): Promise<LoadedFile> => ({ text: await file.text(), name: baseName(file.name) });

export const readDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Could not read the file.')));
    reader.readAsDataURL(file);
  });

export const hasFiles = (event: { dataTransfer: DataTransfer | null }): boolean =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');
