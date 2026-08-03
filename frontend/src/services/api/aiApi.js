const BACKEND_NOT_IMPLEMENTED_ERROR = 'Backend not implemented.';

function notImplemented() {
  throw new Error(BACKEND_NOT_IMPLEMENTED_ERROR);
}

export function generateStrategy() {
  notImplemented();
}

export function generateCaption() {
  notImplemented();
}

export function generateBlogTitle() {
  notImplemented();
}

export function generateBlogBody() {
  notImplemented();
}

export function generateCopy() {
  notImplemented();
}

const aiApi = {
  generateStrategy,
  generateCaption,
  generateBlogTitle,
  generateBlogBody,
  generateCopy,
};

export default aiApi;
