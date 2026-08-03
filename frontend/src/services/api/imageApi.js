const BACKEND_NOT_IMPLEMENTED_ERROR = 'Backend not implemented.';

function notImplemented() {
  return 'https://placehold.co/800x800/png?text=Image+Preview';
}

export function getImageUrl(path) {
  return path ? notImplemented() : null;
}

export async function uploadImage() {
  return { data: { ok: true } };
}

export async function regenerateImage() {
  return { data: { ok: true } };
}

export async function deleteImage() {
  return { data: { ok: true } };
}

const imageApi = {
  getImageUrl,
  uploadImage,
  regenerateImage,
  deleteImage,
};

export default imageApi;
