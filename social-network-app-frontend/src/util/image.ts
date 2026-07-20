export const generateBase64FromImage = (
  imageFile: File
): Promise<string | ArrayBuffer | null> => {
  const reader = new FileReader();

  const promise = new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    reader.onload = (e) => resolve(e.target?.result ?? null);
    reader.onerror = (err) => reject(err);
  });

  reader.readAsDataURL(imageFile);
  return promise;
};
