import { ImagePlus, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

interface ImageUploadProps {
  files: File[]
  existingImages: string[]
  uploadsEnabled: boolean
  onFilesChange: (files: File[]) => void
  onExistingImagesChange: (images: string[]) => void
}

const maxImageCount = 10
const maxImageSize = 5 * 1024 * 1024
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUpload({
  files,
  existingImages,
  uploadsEnabled,
  onFilesChange,
  onExistingImagesChange,
}: ImageUploadProps) {
  const filePreviews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(
    () => () => filePreviews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [filePreviews],
  )

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return
    }

    const selectedFiles = Array.from(fileList)
    const invalidFile = selectedFiles.find(
      (file) =>
        !acceptedImageTypes.includes(file.type) || file.size > maxImageSize,
    )

    if (invalidFile) {
      toast.error(
        'Choose JPEG, PNG, or WebP images smaller than 5 MB each.',
      )
      return
    }

    if (existingImages.length + files.length + selectedFiles.length > maxImageCount) {
      toast.error(`A product can have at most ${maxImageCount} images.`)
      return
    }

    onFilesChange([...files, ...selectedFiles])
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Product images
        </span>
        <span className="text-xs text-slate-500">
          {uploadsEnabled
            ? 'JPEG, PNG, or WebP · max 5 MB each'
            : 'Image uploads are disabled until Firebase Storage is enabled on a billing plan that supports it.'}
        </span>
      </div>
      <label
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-950 ${
          uploadsEnabled
            ? 'cursor-pointer hover:border-blue-400'
            : 'cursor-not-allowed opacity-60'
        }`}
      >
        <ImagePlus aria-hidden="true" className="mb-2 size-6 text-slate-400" />
        <span className="text-sm font-medium">
          {uploadsEnabled ? 'Choose product images' : 'Image uploads unavailable'}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          {existingImages.length + files.length} of {maxImageCount} selected
        </span>
        <input
          type="file"
          multiple
          accept={acceptedImageTypes.join(',')}
          disabled={!uploadsEnabled}
          className="sr-only"
          onChange={(event) => {
            addFiles(event.currentTarget.files)
            event.currentTarget.value = ''
          }}
        />
      </label>
      {(existingImages.length > 0 || filePreviews.length > 0) && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {existingImages.map((url, index) => (
            <li key={url} className="group relative aspect-square">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="size-full rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label={`Remove product image ${index + 1}`}
                disabled={!uploadsEnabled}
                className="absolute right-1 top-1 rounded-full bg-slate-950/75 p-1 text-white"
                onClick={() =>
                  onExistingImagesChange(
                    existingImages.filter((image) => image !== url),
                  )
                }
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
          {filePreviews.map(({ file, url }, index) => (
            <li key={`${file.name}-${file.lastModified}`} className="group relative aspect-square">
              <img
                src={url}
                alt={`Selected image ${index + 1}`}
                className="size-full rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label={`Remove selected image ${index + 1}`}
                className="absolute right-1 top-1 rounded-full bg-slate-950/75 p-1 text-white"
                onClick={() =>
                  onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
