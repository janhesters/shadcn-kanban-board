import type { Accept } from 'react-dropzone';

/*
Intents
*/
export const UPDATE_USER_ACCOUNT_INTENT = 'update-user-account';
export const DELETE_USER_ACCOUNT_INTENT = 'delete-user-account';

/*
Avatar
*/
export const AVATAR_MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
export const ACCEPTED_IMAGE_TYPES: Accept = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/jpg': ['.jpg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
export const acceptedFileExtensions = [
  ...new Set(Object.values(ACCEPTED_IMAGE_TYPES).flat()),
];
