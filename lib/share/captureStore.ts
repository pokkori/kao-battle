let capturedFaceDataUrl: string | null = null;

export function setCapturedFace(dataUrl: string | null): void {
  capturedFaceDataUrl = dataUrl;
}

export function getCapturedFace(): string | null {
  return capturedFaceDataUrl;
}

export function clearCapturedFace(): void {
  capturedFaceDataUrl = null;
}
