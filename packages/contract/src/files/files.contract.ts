import { oc } from '@orpc/contract';
import {
  uploadIntentSchema,
  uploadIntentOutputSchema,
  listFilesSchema,
  listFilesOutputSchema,
  deleteFileSchema,
  successOutputSchema,
} from '@cloudvault/validators';

export const filesContract = oc.router({
  createUploadIntent: oc
    .route({ method: 'POST', path: '/files/upload-intent' })
    .input(uploadIntentSchema)
    .output(uploadIntentOutputSchema),

  list: oc
    .route({ method: 'GET', path: '/files' })
    .input(listFilesSchema)
    .output(listFilesOutputSchema),

  delete: oc
    .route({ method: 'DELETE', path: '/files/{fileId}' })
    .input(deleteFileSchema)
    .output(successOutputSchema),
});
